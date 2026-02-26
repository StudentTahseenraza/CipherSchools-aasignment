import pkg from 'pg';
const { Pool } = pkg;

export const createDatabasePools = () => {
    // Write pool (for reading assignment data)
    const writePool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    // Read-only pool (for executing user queries)
    const readOnlyPool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_READONLY_USER,
        password: process.env.DB_READONLY_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        // Set default session parameters for read-only
        options: '-c default_transaction_read_only=on -c statement_timeout=5000'
    });

    // Test connections
    writePool.on('error', (err) => {
        console.error('Unexpected error on write pool', err);
    });

    readOnlyPool.on('error', (err) => {
        console.error('Unexpected error on read-only pool', err);
    });

    return { writePool, readOnlyPool };
};