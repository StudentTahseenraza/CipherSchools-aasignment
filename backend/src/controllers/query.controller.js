import { readOnlyPool } from '../app.js';

const MAX_ROWS = parseInt(process.env.MAX_ROWS_RETURN) || 1000;
const QUERY_TIMEOUT = parseInt(process.env.QUERY_TIMEOUT_MS) || 5000;

export const executeQuery = async (req, res, next) => {
    const { query, assignmentId } = req.query;
    const startTime = Date.now();

    console.log('Executing query:', query);
    console.log('Assignment ID:', assignmentId);

    // Validate inputs
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            error: 'Query is required' 
        });
    }

    // Check for dangerous operations
    const dangerousPatterns = [
        /drop\s+table/i,
        /truncate\s+table/i,
        /delete\s+from/i,
        /update\s+.+\s+set/i,
        /insert\s+into/i,
        /create\s+table/i,
        /alter\s+table/i,
        /grant\s+/i,
        /revoke\s+/i,
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
            return res.status(403).json({ 
                success: false,
                error: 'Query contains forbidden operations. Only SELECT queries are allowed.' 
            });
        }
    }

    // Ensure it's a SELECT statement
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
        return res.status(403).json({ 
            success: false,
            error: 'Only SELECT queries are allowed for security reasons.' 
        });
    }

    try {
        // Set statement timeout for this query
        await readOnlyPool.query(`SET statement_timeout = ${QUERY_TIMEOUT}`);

        // Execute the query with row limit
        const limitedQuery = `SELECT * FROM (${query}) AS limited_query LIMIT ${MAX_ROWS}`;
        
        console.log('Executing SQL:', limitedQuery);
        const result = await readOnlyPool.query(limitedQuery);
        
        const executionTime = Date.now() - startTime;

        // Format the results
        const formattedResults = {
            success: true,
            data: result.rows,
            columns: result.fields.map(field => ({
                name: field.name,
                dataType: field.dataTypeID,
            })),
            rowCount: result.rowCount,
            executionTime,
            truncated: result.rowCount >= MAX_ROWS
        };

        res.json(formattedResults);
    } catch (error) {
        console.error('Query execution error:', error);
        
        // Format PostgreSQL errors for frontend
        const errorResponse = {
            success: false,
            error: error.message,
        };

        // Handle specific PostgreSQL error codes
        if (error.code === '57014') { // statement_timeout
            errorResponse.userMessage = 'Query took too long to execute. Please optimize your query.';
        } else if (error.code === '42601') { // syntax_error
            errorResponse.userMessage = 'There is a syntax error in your SQL query.';
        } else if (error.code === '42P01') { // undefined_table
            errorResponse.userMessage = 'Table does not exist. Check the table name.';
        } else if (error.code === '42703') { // undefined_column
            errorResponse.userMessage = 'Column does not exist. Check column names.';
        } else {
            errorResponse.userMessage = error.message;
        }

        res.status(400).json(errorResponse);
    }
};