import mongoose from 'mongoose';

const queryHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  query: {
    type: String,
    required: true
  },
  queryHash: {
    type: String, // For deduplication
    index: true
  },
  executionDetails: {
    success: Boolean,
    executionTime: Number,
    rowsAffected: Number,
    errorDetails: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: String
}, {
  collection: 'queryHistory',
  capped: { size: 52428800, max: 10000 } // 50MB capped collection, max 10000 documents
});

// Index for quick retrieval
queryHistorySchema.index({ userId: 1, timestamp: -1 });
queryHistorySchema.index({ queryHash: 1, timestamp: -1 });

export const QueryHistory = mongoose.model('QueryHistory', queryHistorySchema);