import { writePool } from '../app.js';
import { Assignment } from '../models/mongodb/Assignment.model.js';
import { UserAttempt } from '../models/mongodb/UserAttempt.model.js';

export const getAssignments = async (req, res, next) => {
  try {
    const { difficulty, category, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = { isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    // Get assignments from MongoDB with pagination
    const assignments = await Assignment.find(filter)
      .select('title description difficulty category metadata.estimatedTime')
      .sort({ difficulty: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Assignment.countDocuments(filter);

    // Get additional stats from PostgreSQL (if needed)
    // For each assignment, get table info from PostgreSQL
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        // Get table schemas from PostgreSQL for this assignment
        const tables = await writePool.query(
          'SELECT table_name FROM assignment_tables WHERE assignment_id = $1',
          [assignment._id.toString()]
        );

        return {
          ...assignment.toJSON(),
          tables: tables.rows,
          // Add attempt count if user is logged in
          userAttempts: req.user ? await UserAttempt.countDocuments({
            userId: req.user.id,
            assignmentId: assignment._id
          }) : null
        };
      })
    );

    res.json({
      success: true,
      data: assignmentsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Get assignment from MongoDB
    const assignment = await Assignment.findById(id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Get table information from PostgreSQL
    const tables = await writePool.query(
      'SELECT table_name, create_statement FROM assignment_tables WHERE assignment_id = $1',
      [id]
    );

    // Get sample data from PostgreSQL
    const sampleData = {};
    for (const table of tables.rows) {
      const data = await writePool.query(
        `SELECT * FROM ${table.table_name} LIMIT 5`
      );
      sampleData[table.table_name] = data.rows;
    }

    // Get user's previous attempts if logged in
    let userAttempts = [];
    if (req.user) {
      userAttempts = await UserAttempt.find({
        userId: req.user.id,
        assignmentId: id
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('sqlQuery executionDetails createdAt');
    }

    // Track view (for analytics)
    if (req.user) {
      await UserProgress.findOneAndUpdate(
        { userId: req.user.id, assignmentId: id },
        { $inc: { views: 1 }, lastViewedAt: new Date() },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      assignment: {
        ...assignment.toJSON(),
        // Don't send solution to client
        solution: undefined
      },
      tables: tables.rows,
      sampleData,
      userAttempts,
      hints: assignment.hints // Only send non-solution hints
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create assignment (stores in both MongoDB and PostgreSQL)
export const createAssignment = async (req, res, next) => {
  const { 
    title, description, difficulty, category, 
    questionText, tableSchemas, hints, solution,
    sampleDataQueries 
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create assignment in MongoDB
    const [assignment] = await Assignment.create([{
      title,
      description,
      difficulty,
      category,
      questionText,
      tableSchemas,
      hints: hints.map((hint, index) => ({ text: hint, order: index })),
      solution,
      createdBy: req.user?.id,
      isActive: true
    }], { session });

    // 2. Create tables in PostgreSQL for this assignment
    for (const schema of tableSchemas) {
      // Store table schema in PostgreSQL
      await writePool.query(
        `INSERT INTO assignment_tables (assignment_id, table_name, create_statement, sample_data) 
         VALUES ($1, $2, $3, $4)`,
        [assignment._id.toString(), schema.table, schema.createStatement, JSON.stringify(schema.sampleData)]
      );

      // Actually create the table in PostgreSQL if it doesn't exist
      await writePool.query(schema.createStatement);
      
      // Insert sample data if provided
      if (schema.sampleData && schema.sampleData.length > 0) {
        // Build insert query dynamically
        // This would need proper implementation based on your data structure
      }
    }

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      id: assignment._id,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Track user attempt
export const saveAttempt = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { assignmentId, query, executionDetails } = req.body;

  try {
    // Save attempt to MongoDB
    const attempt = await UserAttempt.create({
      userId: req.user.id,
      assignmentId,
      sqlQuery: query,
      executionDetails,
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        sessionId: req.session?.id
      }
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        'stats.totalQueriesExecuted': 1,
        'stats.totalTimeSpent': executionDetails.executionTime / 60000 // convert to minutes
      }
    });

    // Update assignment stats
    await Assignment.findByIdAndUpdate(assignmentId, {
      $inc: {
        'metadata.totalAttempts': 1
      }
    });

    res.json({
      success: true,
      attemptId: attempt._id
    });
  } catch (error) {
    next(error);
  }
};