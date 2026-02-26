import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/mongodb/User.model.js';
import { UserAttempt } from '../models/mongodb/UserAttempt.model.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        next(error);
    }
});

// Update user preferences
router.patch('/preferences', authenticate, async (req, res, next) => {
    try {
        const { theme, fontSize, autoSave } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                preferences: { theme, fontSize, autoSave },
                updatedAt: new Date()
            },
            { new: true }
        ).select('-passwordHash');

        res.json({
            success: true,
            preferences: user.preferences
        });
    } catch (error) {
        next(error);
    }
});

// Get user attempts history
router.get('/attempts', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const attempts = await UserAttempt.find({ userId: req.user.id })
            .populate('assignmentId', 'title difficulty category')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await UserAttempt.countDocuments({ userId: req.user.id });

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

// Get user stats
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const stats = await UserAttempt.aggregate([
            { $match: { userId: req.user.id } },
            { $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                successfulAttempts: {
                    $sum: { $cond: ['$executionDetails.isCorrect', 1, 0] }
                },
                avgExecutionTime: { $avg: '$executionDetails.executionTime' },
                totalQueries: { $sum: 1 }
            }}
        ]);

        const byDifficulty = await UserAttempt.aggregate([
            { $match: { userId: req.user.id } },
            {
                $lookup: {
                    from: 'assignments',
                    localField: 'assignmentId',
                    foreignField: '_id',
                    as: 'assignment'
                }
            },
            { $unwind: '$assignment' },
            {
                $group: {
                    _id: '$assignment.difficulty',
                    count: { $sum: 1 },
                    successRate: {
                        $avg: { $cond: ['$executionDetails.isCorrect', 100, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            stats: stats[0] || {
                totalAttempts: 0,
                successfulAttempts: 0,
                avgExecutionTime: 0,
                totalQueries: 0
            },
            byDifficulty
        });
    } catch (error) {
        next(error);
    }
});

export default router;