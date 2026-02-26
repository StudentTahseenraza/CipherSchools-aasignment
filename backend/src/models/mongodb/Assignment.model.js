import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  category: {
    type: String,
    required: true,
    enum: ['Basic Queries', 'Joins', 'Aggregation', 'Subqueries', 'Window Functions']
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  tableSchemas: [{
    table: { type: String, required: true },
    columns: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      description: String,
      isPrimaryKey: { type: Boolean, default: false },
      isForeignKey: { type: Boolean, default: false },
      references: {
        table: String,
        column: String
      }
    }]
  }],
  hints: [{
    text: String,
    order: Number,
    category: { type: String, enum: ['syntax', 'logic', 'optimization'] }
  }],
  solution: {
    type: String,
    select: false // Don't return by default
  },
  sampleDataQueries: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: { type: Boolean, default: true },
  tags: [String],
  metadata: {
    estimatedTime: Number, // in minutes
    successRate: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    averageExecutionTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'assignments'
});

// Index for search
assignmentSchema.index({ title: 'text', description: 'text', tags: 'text' });
assignmentSchema.index({ difficulty: 1, category: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);