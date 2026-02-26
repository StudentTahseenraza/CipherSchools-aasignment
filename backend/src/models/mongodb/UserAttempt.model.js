import mongoose from 'mongoose';

const userAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  sqlQuery: {
    type: String,
    required: true
  },
  executionDetails: {
    executionTime: Number, // in ms
    rowsReturned: Number,
    isCorrect: Boolean,
    errorMessage: String,
    errorCode: String,
    status: {
      type: String,
      enum: ['success', 'error', 'timeout', 'validation-error'],
      required: true
    }
  },
  metadata: {
    userAgent: String,
    ip: String,
    sessionId: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Auto-delete after 30 days
  }
}, {
  timestamps: true,
  collection: 'userAttempts'
});

// Compound indexes for analytics
userAttemptSchema.index({ userId: 1, assignmentId: 1, createdAt: -1 });
userAttemptSchema.index({ assignmentId: 1, 'executionDetails.status': 1 });

export const UserAttempt = mongoose.model('UserAttempt', userAttemptSchema);