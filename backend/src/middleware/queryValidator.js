import { query, validationResult } from 'express-validator';

// List of dangerous SQL operations to block
const DANGEROUS_PATTERNS = [
    /drop\s+table/i,
    /truncate\s+table/i,
    /delete\s+from/i,
    /update\s+.+\s+set/i,
    /insert\s+into/i,
    /create\s+table/i,
    /alter\s+table/i,
    /grant\s+/i,
    /revoke\s+/i,
    /;\s*drop/i,
    /;\s*delete/i,
    /;\s*insert/i,
    /;\s*update/i,
    /;\s*create/i,
    /;\s*alter/i,
    /--/,
    /\/\*.*\*\//
];

export const validateQuery = [
    query('query').trim().notEmpty().withMessage('Query cannot be empty'),
    // Change this from isInt() to isString() or remove validation
    query('assignmentId').optional().isString().withMessage('Valid assignment ID is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { query } = req.query;
        
        // Check for dangerous patterns
        for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(query)) {
                return res.status(403).json({ 
                    error: 'Query contains forbidden operations. Only SELECT queries are allowed.' 
                });
            }
        }

        // Ensure it's a SELECT statement
        const trimmedQuery = query.trim().toUpperCase();
        if (!trimmedQuery.startsWith('SELECT')) {
            return res.status(403).json({ 
                error: 'Only SELECT queries are allowed for security reasons.' 
            });
        }

        next();
    }
];