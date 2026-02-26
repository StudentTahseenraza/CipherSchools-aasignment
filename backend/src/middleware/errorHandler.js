export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'Duplicate key error',
                message: 'A record with this information already exists'
            });
        }
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            messages: errors
        });
    }

    // PostgreSQL errors
    if (err.code) {
        // PostgreSQL error codes
        const pgErrors = {
            '42P01': 'Table does not exist',
            '42703': 'Column does not exist',
            '42601': 'Syntax error in SQL',
            '57014': 'Query timeout',
            '42501': 'Permission denied'
        };

        if (pgErrors[err.code]) {
            return res.status(400).json({
                success: false,
                error: pgErrors[err.code],
                details: err.message,
                code: err.code
            });
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // Default error
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};