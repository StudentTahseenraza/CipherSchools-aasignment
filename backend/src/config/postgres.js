import pkg from 'pg';
const { Pool } = pkg;

export const createPostgresPools = () => {
    // Write pool (for admin operations - reading assignment data, schema info)
    const writePool = new Pool({
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT) || 5432,
        database: process.env.PG_DB_NAME || 'ciphersqlstudio',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'Tahseen@1234',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    // Read-only pool (for executing user queries - sandbox)
    const readOnlyPool = new Pool({
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT) || 5432,
        database: process.env.PG_DB_NAME || 'ciphersqlstudio',
        user: process.env.PG_READONLY_USER || 'sql_reader',
        password: process.env.PG_READONLY_PASSWORD || 'readonly123',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    // Test connections
    writePool.connect((err, client, release) => {
        if (err) {
            console.error('❌ Error connecting to PostgreSQL (write pool):', err.message);
        } else {
            console.log('✅ PostgreSQL write pool connected successfully');
            release();
        }
    });

    readOnlyPool.connect((err, client, release) => {
        if (err) {
            console.error('❌ Error connecting to PostgreSQL (read-only pool):', err.message);
        } else {
            console.log('✅ PostgreSQL read-only pool connected successfully');
            
            // Set session parameters for read-only pool
            client.query('SET default_transaction_read_only = ON', (err) => {
                if (err) console.error('Error setting read-only mode:', err);
            });
            client.query('SET statement_timeout = 5000', (err) => {
                if (err) console.error('Error setting statement timeout:', err);
            });
            
            release();
        }
    });

    return { writePool, readOnlyPool };
};

// Helper function to test PostgreSQL connection
export const testPostgresConnection = async () => {
    const { writePool } = createPostgresPools();
    try {
        const result = await writePool.query('SELECT NOW() as current_time');
        return {
            success: true,
            time: result.rows[0].current_time,
            message: 'PostgreSQL connection successful'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: 'PostgreSQL connection failed'
        };
    }
};