import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { writePool, readOnlyPool } from '../app.js';
import { Assignment } from '../models/mongodb/Assignment.model.js';
import { UserAttempt } from '../models/mongodb/UserAttempt.model.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateAssignmentId = [
    param('id').isMongoId().withMessage('Invalid assignment ID'),
];

const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

// GET /api/assignments - Get all assignments (with optional filters)
router.get('/', [
    optionalAuthenticate,
    validatePagination,
    query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
    query('category').optional().isString(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            difficulty, 
            category, 
            search,
            page = 1, 
            limit = 10,
            sortBy = 'difficulty',
            order = 'asc'
        } = req.query;

        // Build MongoDB filter
        const filter = { isActive: true };
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;
        if (search) {
            filter.$text = { $search: search };
        }

        // Build sort object
        const sortOrder = order === 'desc' ? -1 : 1;
        const sort = {};
        if (sortBy === 'difficulty') {
            sort['difficulty'] = sortOrder;
        } else {
            sort[sortBy] = sortOrder;
        }

        // Get assignments from MongoDB with pagination
        const assignments = await Assignment.find(filter)
            .select('title description difficulty category questionText tableSchemas hints metadata createdAt')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await Assignment.countDocuments(filter);

        // For each assignment, get additional info from PostgreSQL
        const assignmentsWithDetails = await Promise.all(
            assignments.map(async (assignment) => {
                // Get table information from PostgreSQL - using string ID
                let tables = [];
                try {
                    const tablesResult = await writePool.query(
                        'SELECT table_name FROM assignment_tables WHERE assignment_id = $1',
                        [assignment._id.toString()]
                    );
                    tables = tablesResult.rows;
                } catch (dbError) {
                    console.error(`Error fetching tables for assignment ${assignment._id}:`, dbError.message);
                    // If table doesn't exist or other error, return empty array
                    tables = [];
                }

                // Get user's attempt count if logged in
                let userAttempts = null;
                let lastAttempt = null;
                if (req.user) {
                    const attemptStats = await UserAttempt.find({
                        userId: req.user.id,
                        assignmentId: assignment._id
                    })
                    .sort({ createdAt: -1 })
                    .limit(1)
                    .select('executionDetails.isCorrect createdAt')
                    .lean();

                    userAttempts = attemptStats.length;
                    lastAttempt = attemptStats[0] || null;
                }

                return {
                    ...assignment,
                    tables: tables.map(t => t.table_name),
                    totalTables: tables.length,
                    userAttempts,
                    lastAttempt,
                };
            })
        );

        res.json({
            success: true,
            data: assignmentsWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                difficulty,
                category,
                search
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/assignments/:id - Get single assignment by ID
router.get('/:id', [
    optionalAuthenticate,
    ...validateAssignmentId
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;

        // Get assignment from MongoDB
        const assignment = await Assignment.findById(id)
            .select('-solution')
            .lean();
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false,
                error: 'Assignment not found' 
            });
        }

        // Get table information from PostgreSQL - using string ID
        let tables = [];
        try {
            const tablesResult = await writePool.query(
                'SELECT table_name, create_statement FROM assignment_tables WHERE assignment_id = $1',
                [id.toString()]
            );
            tables = tablesResult.rows;
        } catch (dbError) {
            console.error(`Error fetching tables for assignment ${id}:`, dbError.message);
            // If table doesn't exist, create a default entry
            if (assignment.tableSchemas && assignment.tableSchemas.length > 0) {
                try {
                    // Try to create the table entries
                    for (const schema of assignment.tableSchemas) {
                        const columns = schema.columns.map(col => {
                            return `${col.name} ${col.type}`;
                        }).join(', ');
                        
                        const createStatement = `CREATE TABLE IF NOT EXISTS ${schema.table} (${columns});`;
                        
                        await writePool.query(
                            `INSERT INTO assignment_tables (assignment_id, table_name, create_statement) 
                             VALUES ($1, $2, $3)
                             ON CONFLICT (id) DO NOTHING`,
                            [id.toString(), schema.table, createStatement]
                        );
                        
                        tables.push({
                            table_name: schema.table,
                            create_statement: createStatement
                        });
                    }
                } catch (insertError) {
                    console.error('Error creating table entries:', insertError);
                }
            }
        }

        // Get sample data from PostgreSQL for each table
        const sampleData = {};
        for (const table of tables) {
            try {
                // Check if table exists before querying
                const tableExists = await writePool.query(
                    `SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    )`,
                    [table.table_name]
                );

                if (tableExists.rows[0]?.exists) {
                    const data = await writePool.query(
                        `SELECT * FROM ${table.table_name} LIMIT 5`
                    );
                    sampleData[table.table_name] = data.rows;
                } else {
                    // If table doesn't exist, create it
                    await writePool.query(table.create_statement);
                    sampleData[table.table_name] = [];
                }
            } catch (error) {
                console.error(`Error with table ${table.table_name}:`, error.message);
                sampleData[table.table_name] = [];
            }
        }

        // Get user's previous attempts if logged in
        let userAttempts = [];
        let userProgress = null;
        if (req.user) {
            userAttempts = await UserAttempt.find({
                userId: req.user.id,
                assignmentId: id
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('sqlQuery executionDetails createdAt')
                .lean();

            const totalAttempts = await UserAttempt.countDocuments({
                userId: req.user.id,
                assignmentId: id
            });

            const successfulAttempts = await UserAttempt.countDocuments({
                userId: req.user.id,
                assignmentId: id,
                'executionDetails.isCorrect': true
            });

            userProgress = {
                totalAttempts,
                successfulAttempts,
                successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
                lastAttemptAt: userAttempts[0]?.createdAt || null
            };
        }

        res.json({
            success: true,
            assignment,
            tables,
            sampleData,
            userAttempts,
            userProgress,
            hints: assignment.hints || []
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/assignments/:id/attempt - Save user attempt
router.post('/:id/attempt', [
    authenticate,
    ...validateAssignmentId,
    body('query').notEmpty().withMessage('Query is required'),
    body('executionDetails').isObject().withMessage('Execution details are required')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { query, executionDetails } = req.body;

        // Check if assignment exists
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ 
                success: false,
                error: 'Assignment not found' 
            });
        }

        // Save attempt to MongoDB
        const attempt = await UserAttempt.create({
            userId: req.user.id,
            assignmentId: id,
            sqlQuery: query,
            executionDetails,
            metadata: {
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                sessionId: req.session?.id
            }
        });

        // Update assignment stats
        await Assignment.findByIdAndUpdate(id, {
            $inc: {
                'metadata.totalAttempts': 1,
                'metadata.totalQueries': 1
            },
            $set: {
                'metadata.lastAttemptAt': new Date()
            }
        });

        // If the attempt was successful, update success rate
        if (executionDetails.isCorrect) {
            const totalSuccess = await UserAttempt.countDocuments({
                assignmentId: id,
                'executionDetails.isCorrect': true
            });
            
            const totalAttempts = await UserAttempt.countDocuments({
                assignmentId: id
            });

            await Assignment.findByIdAndUpdate(id, {
                $set: {
                    'metadata.successRate': totalAttempts > 0 ? (totalSuccess / totalAttempts) * 100 : 0
                }
            });
        }

        res.json({
            success: true,
            attemptId: attempt._id,
            message: 'Attempt saved successfully'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/assignments/:id/attempts - Get user's attempts for this assignment
router.get('/:id/attempts', [
    authenticate,
    ...validateAssignmentId,
    ...validatePagination
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const attempts = await UserAttempt.find({
            userId: req.user.id,
            assignmentId: id
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await UserAttempt.countDocuments({
            userId: req.user.id,
            assignmentId: id
        });

        res.json({
            success: true,
            attempts,
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
});

// POST /api/assignments - Create new assignment (admin only)
router.post('/', [
    authenticate,
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
    body('category').notEmpty().withMessage('Category is required'),
    body('questionText').notEmpty().withMessage('Question text is required'),
    body('tableSchemas').isArray().withMessage('Table schemas are required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            description,
            difficulty,
            category,
            questionText,
            tableSchemas,
            hints,
            solution,
            tags,
            estimatedTime
        } = req.body;

        // Create assignment in MongoDB
        const assignment = await Assignment.create({
            title,
            description,
            difficulty,
            category,
            questionText,
            tableSchemas,
            hints: hints?.map((hint, index) => ({ 
                text: hint, 
                order: index,
                category: 'general'
            })) || [],
            solution,
            createdBy: req.user.id,
            tags: tags || [],
            metadata: {
                estimatedTime: estimatedTime || 15,
                successRate: 0,
                totalAttempts: 0
            },
            isActive: true
        });

        // Store table information in PostgreSQL
        for (const schema of tableSchemas) {
            try {
                // Generate CREATE TABLE statement
                const columns = schema.columns.map(col => {
                    return `${col.name} ${col.type}`;
                }).join(', ');
                
                const createStatement = `CREATE TABLE IF NOT EXISTS ${schema.table} (\n  ${columns}\n);`;

                // Insert into assignment_tables
                await writePool.query(
                    `INSERT INTO assignment_tables 
                     (assignment_id, table_name, create_statement, sample_data) 
                     VALUES ($1, $2, $3, $4)`,
                    [
                        assignment._id.toString(), 
                        schema.table, 
                        createStatement,
                        JSON.stringify(schema.sampleData || [])
                    ]
                );

                // Create the table in PostgreSQL if it doesn't exist
                await writePool.query(createStatement);

                // Insert sample data if provided
                if (schema.sampleData && schema.sampleData.length > 0) {
                    const columns = Object.keys(schema.sampleData[0]);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    
                    for (const row of schema.sampleData) {
                        const values = columns.map(col => row[col]);
                        await writePool.query(
                            `INSERT INTO ${schema.table} (${columns.join(', ')}) 
                             VALUES (${placeholders})`,
                            values
                        );
                    }
                }
            } catch (dbError) {
                console.error(`Error setting up table ${schema.table}:`, dbError);
                // Continue with other tables even if one fails
            }
        }

        res.status(201).json({
            success: true,
            id: assignment._id,
            message: 'Assignment created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/assignments/:id/check-answer - Check if query is correct
router.post('/:id/check-answer', [
    optionalAuthenticate,
    ...validateAssignmentId,
    body('query').notEmpty().withMessage('Query is required')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { query } = req.body;

        // Get assignment to check solution
        const assignment = await Assignment.findById(id).select('solution');
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false,
                error: 'Assignment not found' 
            });
        }

        // If no solution is stored, we can't validate
        if (!assignment.solution) {
            return res.json({
                success: true,
                isCorrect: null,
                message: 'No solution available for validation'
            });
        }

        try {
            // Execute user query
            const userResult = await readOnlyPool.query(query);
            
            // Execute solution query
            const solutionResult = await readOnlyPool.query(assignment.solution);

            // Compare results (simplified)
            const isCorrect = JSON.stringify(userResult.rows) === JSON.stringify(solutionResult.rows);

            // Save attempt if user is logged in
            if (req.user) {
                await UserAttempt.create({
                    userId: req.user.id,
                    assignmentId: id,
                    sqlQuery: query,
                    executionDetails: {
                        isCorrect,
                        status: isCorrect ? 'success' : 'incorrect',
                        executionTime: 0,
                        rowsReturned: userResult.rowCount
                    }
                });
            }

            res.json({
                success: true,
                isCorrect,
                message: isCorrect ? 'Correct! Well done!' : 'Not quite right. Try again!'
            });
        } catch (queryError) {
            res.json({
                success: true,
                isCorrect: false,
                message: 'Your query has syntax errors: ' + queryError.message
            });
        }
    } catch (error) {
        next(error);
    }
});

export default router;