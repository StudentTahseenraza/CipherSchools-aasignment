import mongoose from 'mongoose';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { Assignment } from './models/mongodb/Assignment.model.js';

dotenv.config();

const pgPool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DB_NAME || 'ciphersqlstudio',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
});

async function migrateAssignmentTables() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all assignments
        const assignments = await Assignment.find({ isActive: true });
        console.log(`📦 Found ${assignments.length} assignments`);

        // For each assignment, insert into PostgreSQL
        for (const assignment of assignments) {
            console.log(`\n🔄 Processing assignment: ${assignment.title}`);
            
            // Insert table schemas into PostgreSQL
            for (const schema of assignment.tableSchemas) {
                // Generate CREATE TABLE statement
                const columns = schema.columns.map(col => {
                    return `${col.name} ${col.type} ${col.isPrimaryKey ? 'PRIMARY KEY' : ''}`;
                }).join(',\n  ');
                
                const createStatement = `CREATE TABLE IF NOT EXISTS ${schema.table} (\n  ${columns}\n);`;

                // Check if entry already exists
                const existing = await pgPool.query(
                    'SELECT id FROM assignment_tables WHERE assignment_id = $1 AND table_name = $2',
                    [assignment._id.toString(), schema.table]
                );

                if (existing.rows.length === 0) {
                    // Insert new record
                    await pgPool.query(
                        `INSERT INTO assignment_tables (assignment_id, table_name, create_statement) 
                         VALUES ($1, $2, $3)`,
                        [assignment._id.toString(), schema.table, createStatement]
                    );
                    console.log(`  ✅ Added table: ${schema.table}`);
                } else {
                    console.log(`  ⏭️  Table already exists: ${schema.table}`);
                }
            }
        }

        console.log('\n✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateAssignmentTables();