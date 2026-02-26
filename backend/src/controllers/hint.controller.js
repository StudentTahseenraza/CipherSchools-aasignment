import { writePool } from '../app.js';
import llmService from '../services/llmService.js';

export const generateHint = async (req, res, next) => {
  const { query, assignmentId } = req.body;

  console.log('🔍 Generating hint for assignment:', assignmentId);
  console.log('📝 Current query:', query);

  try {
    // Get assignment details from MongoDB (not PostgreSQL)
    // Since we're using MongoDB for assignment data, we need to import the Assignment model
    import('../models/mongodb/Assignment.model.js').then(async ({ Assignment }) => {
      try {
        console.log('🔎 Looking up assignment in MongoDB with ID:', assignmentId);
        
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
          console.log('❌ Assignment not found in MongoDB');
          
          // Fallback to predefined hints
          return res.json({
            success: true,
            hint: "Here are some general SQL tips:",
            predefinedHints: [
              "Check your WHERE clause conditions",
              "Verify you're selecting the correct columns",
              "Consider using appropriate JOIN types",
              "Remember that SQL keywords are case-insensitive but table/column names may be case-sensitive"
            ],
            provider: 'fallback',
            fromCache: true
          });
        }

        console.log('✅ Assignment found:', assignment.title);

        // Prepare data for LLM
        const llmInput = {
          title: assignment.title,
          question_text: assignment.question_text || assignment.questionText || '',
          query: query || '',
          schema: assignment.tableSchemas || [],
          hints: assignment.hints || []
        };

        // Get hint from LLM service
        const hintResult = await llmService.getHint('', llmInput);

        res.json({
          success: true,
          hint: hintResult.hint,
          predefinedHints: assignment.hints?.map(h => h.text || h) || [],
          provider: hintResult.provider,
          isMock: hintResult.isMock || false,
          timestamp: new Date().toISOString()
        });

      } catch (mongoError) {
        console.error('❌ MongoDB error:', mongoError);
        
        // Ultimate fallback - return predefined hints
        return res.json({
          success: true,
          hint: "Here are some helpful SQL tips:",
          predefinedHints: [
            "Make sure you're using the correct table names",
            "Check if you need to use JOINs",
            "Remember to filter with WHERE clause",
            "Use GROUP BY when using aggregate functions",
            "ORDER BY can help sort your results"
          ],
          provider: 'fallback',
          fromCache: true
        });
      }
    }).catch(err => {
      console.error('❌ Error importing Assignment model:', err);
      
      res.json({
        success: true,
        hint: "Unable to generate AI hint at the moment. Here are some general tips:",
        predefinedHints: [
          "Verify your table and column names",
          "Check your SQL syntax",
          "Make sure you're using the correct JOIN type",
          "Consider using LIMIT to test your query first"
        ],
        provider: 'error-fallback'
      });
    });

  } catch (error) {
    console.error('❌ Hint generation error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate hint. Please try again.',
      details: error.message
    });
  }
};

// Endpoint to check available providers
export const getAvailableProviders = async (req, res) => {
  const providers = {
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    huggingface: !!process.env.HUGGINGFACE_API_KEY,
    mock: true,
    current: process.env.LLM_PROVIDER || 'gemini'
  };
  
  res.json({ success: true, providers });
};