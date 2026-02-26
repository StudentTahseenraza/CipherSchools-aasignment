import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function fixDatabase() {
    console.log('🔧 Fixing database schema...');
    
    const pool = new Pool({
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT) || 5432,
        database: process.env.PG_DB_NAME || 'ciphersqlstudio',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'postgres',
    });

    try {
        // Drop the existing table if it exists
        console.log('📊 Dropping existing assignment_tables table...');
        await pool.query(`DROP TABLE IF EXISTS assignment_tables CASCADE;`);
        
        // Create the table with correct VARCHAR type for assignment_id
        console.log('📊 Creating new assignment_tables table with VARCHAR assignment_id...');
        await pool.query(`
            CREATE TABLE assignment_tables (
                id SERIAL PRIMARY KEY,
                assignment_id VARCHAR(100) NOT NULL,
                table_name VARCHAR(100) NOT NULL,
                create_statement TEXT NOT NULL,
                sample_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create an index for faster lookups
        await pool.query(`
            CREATE INDEX idx_assignment_tables_assignment_id 
            ON assignment_tables(assignment_id);
        `);
        
        console.log('✅ Database schema fixed successfully!');
        
        // Insert sample data for the existing assignments
        console.log('📝 Inserting sample data for existing assignments...');
        
        // Sample data for employees table
        await pool.query(`
            INSERT INTO assignment_tables (assignment_id, table_name, create_statement) VALUES
            ('699f3803a929a3e2cbd3f2ee', 'employees', 'CREATE TABLE employees (id SERIAL PRIMARY KEY, first_name VARCHAR(50), last_name VARCHAR(50), email VARCHAR(100), department VARCHAR(50), salary DECIMAL(10,2), hire_date DATE);'),
            ('699f3803a929a3e2cbd3f309', 'customers', 'CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), city VARCHAR(50));'),
            ('699f3803a929a3e2cbd3f309', 'orders', 'CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), order_date DATE, total_amount DECIMAL(10,2), status VARCHAR(20));'),
            ('699f3803a929a3e2cbd3f2fa', 'sales', 'CREATE TABLE sales (id SERIAL PRIMARY KEY, product_id INTEGER, sale_date DATE, quantity INTEGER, unit_price DECIMAL(10,2), total_amount DECIMAL(10,2));')
            ON CONFLICT (id) DO NOTHING;
        `);
        
        console.log('✅ Sample data inserted successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing database:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixDatabase();