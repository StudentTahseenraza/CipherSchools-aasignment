import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { connectMongoDB } from './config/mongodb.js';
import { createPostgresPools } from './config/postgres.js';

// Import routes
import assignmentRoutes from './routes/assignment.routes.js';
import queryRoutes from './routes/query.routes.js';
import hintRoutes from './routes/hint.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (Persistence Layer)
await connectMongoDB();

// Create PostgreSQL connection pools (Sandbox Layer)
export const { writePool, readOnlyPool } = createPostgresPools();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/hint', hintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        databases: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            postgres: {
                write: 'connected', // You'd need actual check here
                readOnly: 'connected'
            }
        }
    });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 MongoDB: ${process.env.MONGODB_URI?.split('@')[1] || 'local'}`);
    console.log(`🐘 PostgreSQL: ${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DB_NAME}`);
});

export default app;