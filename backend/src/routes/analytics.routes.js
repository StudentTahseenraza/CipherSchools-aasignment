import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Assignment } from '../models/mongodb/Assignment.model.js';
import { UserAttempt } from '../models/mongodb/UserAttempt.model.js';

const router = express.Router();

// Get overall platform analytics (admin only - you'd add admin check)
router.get('/overview', authenticate, async (req, res, next) => {
    try {
        // Check if user is admin (you'd implement this)
        // if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

        const totalUsers = await User.countDocuments();
        const totalAssignments = await Assignment.countDocuments({ isActive: true });
        const totalAttempts = await UserAttempt.countDocuments();
        
        const recentActivity = await UserAttempt.find()
            .populate('userId', 'email name')
            .populate('assignmentId', 'title')
            .sort({ createdAt: -1 })
            .limit(10);

        const successRate = await UserAttempt.aggregate([
            { $group: {
                _id: null,
                total: { $sum: 1 },
                successful: {
                    $sum: { $cond: ['$executionDetails.isCorrect', 1, 0] }
                }
            }},
            { $project: {
                rate: { $multiply: [{ $divide: ['$successful', '$total'] }, 100] }
            }}
        ]);

        res.json({
            success: true,
            analytics: {
                totalUsers,
                totalAssignments,
                totalAttempts,
                successRate: successRate[0]?.rate || 0,
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get assignment-specific analytics
router.get('/assignment/:assignmentId', authenticate, async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        
        const attempts = await UserAttempt.find({ assignmentId })
            .populate('userId', 'email')
            .sort({ createdAt: -1 });

        const stats = await UserAttempt.aggregate([
            { $match: { assignmentId: mongoose.Types.ObjectId(assignmentId) } },
            { $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                uniqueUsers: { $addToSet: '$userId' },
                avgExecutionTime: { $avg: '$executionDetails.executionTime' },
                successCount: {
                    $sum: { $cond: ['$executionDetails.isCorrect', 1, 0] }
                }
            }},
            { $project: {
                totalAttempts: 1,
                uniqueUsers: { $size: '$uniqueUsers' },
                avgExecutionTime: 1,
                successRate: { $multiply: [{ $divide: ['$successCount', '$totalAttempts'] }, 100] }
            }}
        ]);

        res.json({
            success: true,
            analytics: stats[0] || {
                totalAttempts: 0,
                uniqueUsers: 0,
                avgExecutionTime: 0,
                successRate: 0
            },
            recentAttempts: attempts.slice(0, 10)
        });
    } catch (error) {
        next(error);
    }
});

export default router;