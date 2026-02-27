import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/mongodb/User.model.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register (regular user)
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                error: 'User already exists' 
            });
        }

        // Create user (regular user, not admin)
        const user = await User.create({
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            name: name || email.split('@')[0],
            isAdmin: false // Explicitly set as non-admin
        });

        // Generate token with isAdmin flag
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                isAdmin: false 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            token,
            user: user.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// Regular User Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user (any user, including admins can login here too)
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token with isAdmin flag
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                isAdmin: user.isAdmin || false 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            token,
            user: user.toJSON(),
            isAdmin: user.isAdmin || false // Send admin status to frontend
        });
    } catch (error) {
        next(error);
    }
});

// Admin Login
router.post('/admin-login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res, next) => {
    try {
        console.log('📝 Admin login attempt:', req.body.email);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid admin credentials' 
            });
        }

        console.log('✅ User found:', user.email);
        console.log('User isAdmin:', user.isAdmin);
        console.log('User has passwordHash:', !!user.passwordHash);

        // Check if user is admin
        if (!user.isAdmin) {
            console.log('❌ User is not an admin');
            return res.status(401).json({ 
                success: false,
                error: 'Invalid admin credentials' 
            });
        }

        // Check password
        console.log('🔐 Verifying password...');
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ 
                success: false,
                error: 'Invalid admin credentials' 
            });
        }

        console.log('✅ Password verified');

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token with admin flag
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                isAdmin: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        console.log('✅ Admin login successful, token generated');

        res.json({
            success: true,
            token,
            user: user.toJSON(),
            isAdmin: true
        });
    } catch (error) {
        console.error('❌ Admin login error:', error);
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        // User is already attached to req by authenticate middleware
        const user = await User.findById(req.user.id).select('-passwordHash');
        
        res.json({
            success: true,
            user: user.toJSON(),
            isAdmin: user.isAdmin || false
        });
    } catch (error) {
        next(error);
    }
});

// Logout
router.post('/logout', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Check if email is available (for registration)
router.post('/check-email', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        
        res.json({
            success: true,
            available: !existingUser
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error checking email' 
        });
    }
});

// Forgot password (optional - can be implemented later)
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Here you would implement password reset logic
        // For now, just return success message
        res.json({
            success: true,
            message: 'Password reset link sent to your email'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error processing request' 
        });
    }
});

// Reset password (optional - can be implemented later)
router.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const { token, password } = req.body;
        
        // Here you would verify token and update password
        // For now, just return success message
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Error resetting password' 
        });
    }
});

export default router;