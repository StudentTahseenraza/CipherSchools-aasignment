import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import { Assignment } from '../models/mongodb/Assignment.model.js';
import { User } from '../models/mongodb/User.model.js';
import { UserAttempt } from '../models/mongodb/UserAttempt.model.js';
import { writePool } from '../app.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate, isAdmin);

// Get all assignments (admin view)
router.get('/assignments', async (req, res, next) => {
    try {
        const assignments = await Assignment.find()
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        next(error);
    }
});

// Get single assignment (admin view)
router.get('/assignments/:id', [
    param('id').isMongoId().withMessage('Invalid assignment ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const assignment = await Assignment.findById(req.params.id).lean();
        
        if (!assignment) {
            return res.status(404).json({ 
                success: false, 
                error: 'Assignment not found' 
            });
        }

        res.json({
            success: true,
            assignment
        });
    } catch (error) {
        next(error);
    }
});

// Create new assignment
router.post('/assignments', [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
    body('category').notEmpty().withMessage('Category is required'),
    body('questionText').notEmpty().withMessage('Question text is required'),
    body('tableSchemas').isArray().withMessage('Table schemas are required')
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

                // Create the table in PostgreSQL
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

// Update assignment
router.put('/assignments/:id', [
    param('id').isMongoId().withMessage('Invalid assignment ID'),
    body('title').optional().notEmpty(),
    body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard'])
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.createdAt;
        delete updates.metadata;

        const assignment = await Assignment.findByIdAndUpdate(
            id,
            {
                ...updates,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!assignment) {
            return res.status(404).json({ 
                success: false,
                error: 'Assignment not found' 
            });
        }

        res.json({
            success: true,
            assignment,
            message: 'Assignment updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Delete assignment (soft delete)
router.delete('/assignments/:id', [
    param('id').isMongoId().withMessage('Invalid assignment ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;

        const assignment = await Assignment.findByIdAndUpdate(
            id,
            { 
                isActive: false,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({ 
                success: false,
                error: 'Assignment not found' 
            });
        }

        res.json({
            success: true,
            message: 'Assignment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Get admin statistics
router.get('/stats', async (req, res, next) => {
    try {
        const [totalAssignments, totalUsers, totalAttempts] = await Promise.all([
            Assignment.countDocuments({ isActive: true }),
            User.countDocuments(),
            UserAttempt.countDocuments()
        ]);

        const successRate = await UserAttempt.aggregate([
            { $match: { 'executionDetails.isCorrect': true } },
            { $count: 'successful' }
        ]);

        const successful = successRate[0]?.successful || 0;
        const rate = totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0;

        res.json({
            success: true,
            data: {
                totalAssignments,
                totalUsers,
                totalAttempts,
                successRate: Math.round(rate)
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;