import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { connectMongoDB } from './config/mongodb.js';
import { createPostgresPools } from './config/postgres.js';

import assignmentRoutes from './routes/assignment.routes.js';
import queryRoutes from './routes/query.routes.js';
import hintRoutes from './routes/hint.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';

import seedAllData from './seed-mock-data.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// Security Middleware
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// ===============================
// CORS Configuration
// ===============================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cipher-schools-aasignment.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// ===============================
// Rate Limiting
// ===============================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// ===============================
// Body Parsers
// ===============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// Seed Route (Temporary)
// ===============================
app.get('/seed', async (req, res) => {
  try {
    await seedAllData();
    res.json({ message: 'Seed completed successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seeding failed' });
  }
});

// ===============================
// Routes
// ===============================
app.use('/api/assignments', assignmentRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/hint', hintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// ===============================
// Health Check
// ===============================
app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databases: {
      mongodb:
        mongoose.connection.readyState === 1
          ? 'connected'
          : 'disconnected'
    }
  });
});

// ===============================
// Error Handler
// ===============================
app.use(errorHandler);

// ===============================
// Proper Async Startup (CRITICAL FIX)
// ===============================
let writePool;
let readOnlyPool;

const startServer = async () => {
  try {
    // Connect MongoDB
    await connectMongoDB();
    console.log('✅ MongoDB connected');

    // Initialize PostgreSQL pools
    const pools = createPostgresPools();
    writePool = pools.writePool;
    readOnlyPool = pools.readOnlyPool;
    console.log('✅ PostgreSQL pools initialized');

    // Start server ONLY after DB ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `🐘 PostgreSQL: ${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DB_NAME}`
      );
    });

  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;