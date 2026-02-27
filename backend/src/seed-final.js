import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models
import { User } from './models/mongodb/User.model.js';
import { Assignment } from './models/mongodb/Assignment.model.js';
import { UserAttempt } from './models/mongodb/UserAttempt.model.js';

// PostgreSQL connection
const pgPool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DB_NAME || 'ciphersqlstudio',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
});

// Sample assignment data - with ONLY valid categories from schema
const assignments = [
    {
        title: "Basic SELECT from Employees",
        description: "Learn to retrieve data from an employee table",
        difficulty: "Easy",
        category: "Basic Queries",
        questionText: "Write a query to display all employees who work in the 'Sales' department. Include their first name, last name, and salary.",
        tableSchemas: [{
            table: "employees",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "first_name", type: "VARCHAR(50)" },
                { name: "last_name", type: "VARCHAR(50)" },
                { name: "email", type: "VARCHAR(100)" },
                { name: "department", type: "VARCHAR(50)" },
                { name: "salary", type: "DECIMAL(10,2)" },
                { name: "hire_date", type: "DATE" }
            ]
        }],
        hints: [
            { text: "Use the WHERE clause to filter by department", order: 1, category: "syntax" },
            { text: "Remember to specify only the columns asked for", order: 2, category: "logic" },
            { text: "Department names are case-sensitive", order: 3, category: "optimization" }
        ],
        solution: "SELECT first_name, last_name, salary FROM employees WHERE department = 'Sales';",
        tags: ["SELECT", "WHERE", "filtering"],
        metadata: {
            estimatedTime: 10,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "JOIN Orders and Customers",
        description: "Practice using JOIN operations",
        difficulty: "Medium",
        category: "Joins",
        questionText: "Show all orders with customer names and order dates. Include customers who haven't placed any orders.",
        tableSchemas: [
            {
                table: "customers",
                columns: [
                    { name: "id", type: "INTEGER", isPrimaryKey: true },
                    { name: "name", type: "VARCHAR(100)" },
                    { name: "email", type: "VARCHAR(100)" },
                    { name: "city", type: "VARCHAR(50)" }
                ]
            },
            {
                table: "orders",
                columns: [
                    { name: "id", type: "INTEGER", isPrimaryKey: true },
                    { name: "customer_id", type: "INTEGER", isForeignKey: true, references: { table: "customers", column: "id" } },
                    { name: "order_date", type: "DATE" },
                    { name: "total_amount", type: "DECIMAL(10,2)" },
                    { name: "status", type: "VARCHAR(20)" }
                ]
            }
        ],
        hints: [
            { text: "Consider which type of JOIN you need", order: 1, category: "syntax" },
            { text: "LEFT JOIN will include all customers", order: 2, category: "logic" },
            { text: "Think about which columns to use for joining", order: 3, category: "optimization" }
        ],
        solution: "SELECT c.name, o.order_date, o.total_amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id ORDER BY c.name;",
        tags: ["JOIN", "LEFT JOIN", "relationships"],
        metadata: {
            estimatedTime: 15,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "Aggregate Functions - Sales Analysis",
        description: "Learn to use GROUP BY and aggregate functions",
        difficulty: "Hard",
        category: "Aggregation",
        questionText: "Calculate the total sales amount per month for the year 2023. Show month name and total.",
        tableSchemas: [{
            table: "sales",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "product_id", type: "INTEGER" },
                { name: "sale_date", type: "DATE" },
                { name: "quantity", type: "INTEGER" },
                { name: "unit_price", type: "DECIMAL(10,2)" },
                { name: "total_amount", type: "DECIMAL(10,2)" }
            ]
        }],
        hints: [
            { text: "Use EXTRACT or TO_CHAR for month extraction", order: 1, category: "syntax" },
            { text: "GROUP BY is essential here", order: 2, category: "logic" },
            { text: "SUM() will help calculate totals", order: 3, category: "syntax" },
            { text: "Don't forget to filter for year 2023", order: 4, category: "optimization" }
        ],
        solution: "SELECT TO_CHAR(sale_date, 'Month') as month, SUM(total_amount) as total FROM sales WHERE EXTRACT(YEAR FROM sale_date) = 2023 GROUP BY TO_CHAR(sale_date, 'Month'), EXTRACT(MONTH FROM sale_date) ORDER BY EXTRACT(MONTH FROM sale_date);",
        tags: ["GROUP BY", "SUM", "aggregation", "date functions"],
        metadata: {
            estimatedTime: 20,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "Filtering with Multiple Conditions",
        description: "Practice using AND, OR, and IN operators",
        difficulty: "Easy",
        category: "Basic Queries",
        questionText: "Find all employees in the 'IT' or 'Sales' departments with a salary greater than 60000. Show first name, last name, department, and salary.",
        tableSchemas: [{
            table: "employees",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "first_name", type: "VARCHAR(50)" },
                { name: "last_name", type: "VARCHAR(50)" },
                { name: "email", type: "VARCHAR(100)" },
                { name: "department", type: "VARCHAR(50)" },
                { name: "salary", type: "DECIMAL(10,2)" },
                { name: "hire_date", type: "DATE" }
            ]
        }],
        hints: [
            { text: "Use IN operator for multiple departments", order: 1, category: "syntax" },
            { text: "Combine conditions with AND", order: 2, category: "logic" },
            { text: "Remember to check salary > 60000", order: 3, category: "optimization" }
        ],
        solution: "SELECT first_name, last_name, department, salary FROM employees WHERE department IN ('IT', 'Sales') AND salary > 60000;",
        tags: ["WHERE", "IN", "AND", "filtering"],
        metadata: {
            estimatedTime: 10,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "Sorting and Limiting Results",
        description: "Learn to order and limit query results",
        difficulty: "Easy",
        category: "Basic Queries",
        questionText: "List the top 5 highest paid employees. Show first name, last name, and salary, ordered from highest to lowest salary.",
        tableSchemas: [{
            table: "employees",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "first_name", type: "VARCHAR(50)" },
                { name: "last_name", type: "VARCHAR(50)" },
                { name: "email", type: "VARCHAR(100)" },
                { name: "department", type: "VARCHAR(50)" },
                { name: "salary", type: "DECIMAL(10,2)" },
                { name: "hire_date", type: "DATE" }
            ]
        }],
        hints: [
            { text: "Use ORDER BY with DESC for highest first", order: 1, category: "syntax" },
            { text: "LIMIT 5 will give only top 5", order: 2, category: "syntax" },
            { text: "Make sure to select only required columns", order: 3, category: "optimization" }
        ],
        solution: "SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5;",
        tags: ["ORDER BY", "LIMIT", "sorting"],
        metadata: {
            estimatedTime: 8,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "Subqueries in WHERE Clause",
        description: "Practice using subqueries for filtering",
        difficulty: "Hard",
        category: "Subqueries",
        questionText: "Find customers who have placed orders with total amount greater than the average order amount. Show customer name and email.",
        tableSchemas: [
            {
                table: "customers",
                columns: [
                    { name: "id", type: "INTEGER", isPrimaryKey: true },
                    { name: "name", type: "VARCHAR(100)" },
                    { name: "email", type: "VARCHAR(100)" },
                    { name: "city", type: "VARCHAR(50)" }
                ]
            },
            {
                table: "orders",
                columns: [
                    { name: "id", type: "INTEGER", isPrimaryKey: true },
                    { name: "customer_id", type: "INTEGER" },
                    { name: "order_date", type: "DATE" },
                    { name: "total_amount", type: "DECIMAL(10,2)" },
                    { name: "status", type: "VARCHAR(20)" }
                ]
            }
        ],
        hints: [
            { text: "First calculate average order amount with AVG()", order: 1, category: "syntax" },
            { text: "Use subquery in WHERE clause", order: 2, category: "logic" },
            { text: "Compare each order total with the average", order: 3, category: "optimization" }
        ],
        solution: "SELECT DISTINCT c.name, c.email FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.total_amount > (SELECT AVG(total_amount) FROM orders);",
        tags: ["subquery", "AVG", "comparison"],
        metadata: {
            estimatedTime: 25,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "COUNT and GROUP BY",
        description: "Count records with grouping",
        difficulty: "Medium",
        category: "Aggregation",
        questionText: "Count the number of employees in each department. Show department name and employee count, ordered by count descending.",
        tableSchemas: [{
            table: "employees",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "first_name", type: "VARCHAR(50)" },
                { name: "last_name", type: "VARCHAR(50)" },
                { name: "email", type: "VARCHAR(100)" },
                { name: "department", type: "VARCHAR(50)" },
                { name: "salary", type: "DECIMAL(10,2)" },
                { name: "hire_date", type: "DATE" }
            ]
        }],
        hints: [
            { text: "GROUP BY department to get counts per department", order: 1, category: "syntax" },
            { text: "Use COUNT(*) to count employees", order: 2, category: "syntax" },
            { text: "ORDER BY count DESC for highest first", order: 3, category: "optimization" }
        ],
        solution: "SELECT department, COUNT(*) as employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;",
        tags: ["COUNT", "GROUP BY", "aggregation"],
        metadata: {
            estimatedTime: 12,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "Date Functions and Filtering",
        description: "Work with dates in queries",
        difficulty: "Medium",
        category: "Basic Queries",
        questionText: "Find all orders placed in the last 30 days. Show order ID, customer ID, order date, and total amount.",
        tableSchemas: [{
            table: "orders",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "customer_id", type: "INTEGER" },
                { name: "order_date", type: "DATE" },
                { name: "total_amount", type: "DECIMAL(10,2)" },
                { name: "status", type: "VARCHAR(20)" }
            ]
        }],
        hints: [
            { text: "Use CURRENT_DATE to get today's date", order: 1, category: "syntax" },
            { text: "Subtract 30 days with INTERVAL", order: 2, category: "syntax" },
            { text: "Compare order_date with date range", order: 3, category: "logic" }
        ],
        solution: "SELECT id, customer_id, order_date, total_amount FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';",
        tags: ["dates", "CURRENT_DATE", "INTERVAL"],
        metadata: {
            estimatedTime: 15,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "HAVING Clause with Aggregates",
        description: "Filter grouped results with HAVING",
        difficulty: "Hard",
        category: "Aggregation",
        questionText: "Find departments that have an average salary greater than 70000. Show department and average salary.",
        tableSchemas: [{
            table: "employees",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "first_name", type: "VARCHAR(50)" },
                { name: "last_name", type: "VARCHAR(50)" },
                { name: "email", type: "VARCHAR(100)" },
                { name: "department", type: "VARCHAR(50)" },
                { name: "salary", type: "DECIMAL(10,2)" },
                { name: "hire_date", type: "DATE" }
            ]
        }],
        hints: [
            { text: "GROUP BY department first", order: 1, category: "syntax" },
            { text: "Use AVG(salary) to calculate average", order: 2, category: "syntax" },
            { text: "HAVING filters after GROUP BY", order: 3, category: "logic" },
            { text: "WHERE filters before grouping", order: 4, category: "optimization" }
        ],
        solution: "SELECT department, AVG(salary) as avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 70000;",
        tags: ["HAVING", "AVG", "GROUP BY"],
        metadata: {
            estimatedTime: 18,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    },
    {
        title: "Multiple Table JOIN with Conditions",
        description: "Complex JOIN with multiple conditions",
        difficulty: "Hard",
        category: "Joins",
        questionText: "Show all products that have been ordered more than 5 times. Include product ID and total quantity ordered.",
        tableSchemas: [{
            table: "sales",
            columns: [
                { name: "id", type: "INTEGER", isPrimaryKey: true },
                { name: "product_id", type: "INTEGER" },
                { name: "sale_date", type: "DATE" },
                { name: "quantity", type: "INTEGER" },
                { name: "unit_price", type: "DECIMAL(10,2)" },
                { name: "total_amount", type: "DECIMAL(10,2)" }
            ]
        }],
        hints: [
            { text: "Group by product_id to sum quantities", order: 1, category: "syntax" },
            { text: "Use SUM(quantity) for total orders", order: 2, category: "syntax" },
            { text: "HAVING SUM(quantity) > 5 filters results", order: 3, category: "logic" }
        ],
        solution: "SELECT product_id, SUM(quantity) as total_quantity FROM sales GROUP BY product_id HAVING SUM(quantity) > 5;",
        tags: ["GROUP BY", "SUM", "HAVING"],
        metadata: {
            estimatedTime: 15,
            successRate: 0,
            totalAttempts: 0,
            averageExecutionTime: 0
        },
        isActive: true
    }
];

// PostgreSQL sample data - with proper order (delete children first, then parents)
async function seedPostgreSQL() {
    try {
        console.log('🗄️  Seeding PostgreSQL...');
        
        // First, disable foreign key checks temporarily (for PostgreSQL we need to delete in order)
        await pgPool.query('DROP TABLE IF EXISTS orders CASCADE');
        await pgPool.query('DROP TABLE IF EXISTS customers CASCADE');
        await pgPool.query('DROP TABLE IF EXISTS sales CASCADE');
        await pgPool.query('DROP TABLE IF EXISTS employees CASCADE');
        await pgPool.query('DROP TABLE IF EXISTS assignment_tables CASCADE');
        
        // Create tables in order (parents first, then children)
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                email VARCHAR(100),
                department VARCHAR(50),
                salary DECIMAL(10,2),
                hire_date DATE
            );
            
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100),
                city VARCHAR(50)
            );
            
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                order_date DATE,
                total_amount DECIMAL(10,2),
                status VARCHAR(20)
            );
            
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                product_id INTEGER,
                sale_date DATE,
                quantity INTEGER,
                unit_price DECIMAL(10,2),
                total_amount DECIMAL(10,2)
            );
            
            CREATE TABLE IF NOT EXISTS assignment_tables (
                id SERIAL PRIMARY KEY,
                assignment_id VARCHAR(100),
                table_name VARCHAR(100),
                create_statement TEXT,
                sample_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Tables created successfully');

        // Insert data in correct order (parents first, then children)
        
        // Insert employees
        await pgPool.query(`
            INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES
            ('John', 'Doe', 'john.doe@company.com', 'Sales', 75000.00, '2020-01-15'),
            ('Jane', 'Smith', 'jane.smith@company.com', 'Sales', 82000.00, '2019-03-20'),
            ('Bob', 'Johnson', 'bob.johnson@company.com', 'IT', 90000.00, '2018-06-10'),
            ('Alice', 'Williams', 'alice.williams@company.com', 'HR', 65000.00, '2021-02-01'),
            ('Charlie', 'Brown', 'charlie.brown@company.com', 'Sales', 70000.00, '2022-07-15'),
            ('Diana', 'Miller', 'diana.miller@company.com', 'IT', 95000.00, '2017-11-30'),
            ('Eve', 'Davis', 'eve.davis@company.com', 'Marketing', 72000.00, '2020-09-12'),
            ('Frank', 'Wilson', 'frank.wilson@company.com', 'Sales', 78000.00, '2021-04-05')
        `);
        console.log('✅ Employees inserted');

        // Insert customers (parent table for orders)
        await pgPool.query(`
            INSERT INTO customers (name, email, city) VALUES
            ('Tech Corp', 'contact@techcorp.com', 'San Francisco'),
            ('Global Solutions', 'info@globalsolutions.com', 'New York'),
            ('Local Shop', 'owner@localshop.com', 'Austin'),
            ('Mega Retail', 'sales@megaretail.com', 'Chicago'),
            ('Small Biz', 'hello@smallbiz.com', 'Miami'),
            ('Enterprise Ltd', 'contact@enterprise.com', 'Seattle')
        `);
        console.log('✅ Customers inserted');

        // Insert orders (child table, depends on customers)
        await pgPool.query(`
            INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES
            (1, '2024-01-15', 1500.00, 'completed'),
            (2, '2024-01-20', 2300.50, 'completed'),
            (1, '2024-02-01', 800.00, 'completed'),
            (3, '2024-02-10', 350.75, 'pending'),
            (4, '2024-02-15', 4200.00, 'completed'),
            (2, '2024-03-01', 1800.00, 'shipped'),
            (5, '2024-03-05', 250.00, 'pending'),
            (1, '2024-03-10', 3200.00, 'completed'),
            (6, '2024-03-15', 5600.00, 'completed')
        `);
        console.log('✅ Orders inserted');

        // Insert sales
        await pgPool.query(`
            INSERT INTO sales (product_id, sale_date, quantity, unit_price, total_amount) VALUES
            (101, '2023-01-15', 5, 25.00, 125.00),
            (102, '2023-01-20', 3, 45.00, 135.00),
            (101, '2023-02-01', 8, 25.00, 200.00),
            (103, '2023-02-10', 2, 150.00, 300.00),
            (102, '2023-02-15', 6, 45.00, 270.00),
            (101, '2023-03-01', 4, 25.00, 100.00),
            (104, '2023-03-05', 1, 500.00, 500.00),
            (103, '2023-03-20', 3, 150.00, 450.00),
            (101, '2023-04-10', 7, 25.00, 175.00),
            (102, '2023-04-15', 4, 45.00, 180.00)
        `);
        console.log('✅ Sales inserted');

        console.log('✅ PostgreSQL seeded successfully');
    } catch (error) {
        console.error('❌ PostgreSQL seeding error:', error);
        throw error;
    }
}

// Main seeding function
async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('\n🗑️  Clearing existing data...');
        await Assignment.deleteMany({});
        await User.deleteMany({});
        await UserAttempt.deleteMany({});
        console.log('✅ Existing data cleared');

        // Insert assignments
        console.log('\n📝 Inserting assignments...');
        const insertedAssignments = await Assignment.insertMany(assignments);
        console.log(`✅ Inserted ${insertedAssignments.length} assignments`);

        // Create users
        console.log('\n👤 Creating users...');
        const salt = await bcrypt.genSalt(10);
        
        // Admin user
        await User.create({
            email: 'admin@example.com',
            passwordHash: await bcrypt.hash('admin123', salt),
            name: 'Administrator',
            isAdmin: true
        });
        
        // Demo student
        await User.create({
            email: 'student@example.com',
            passwordHash: await bcrypt.hash('student123', salt),
            name: 'Demo Student',
            isAdmin: false
        });
        
        console.log('✅ Users created');

        // Seed PostgreSQL
        console.log('\n🗄️  Seeding PostgreSQL...');
        await seedPostgreSQL();

        // Link assignments to PostgreSQL tables
        console.log('\n🔗 Linking assignments to PostgreSQL tables...');
        for (const assignment of insertedAssignments) {
            for (const schema of assignment.tableSchemas) {
                const createStatement = `CREATE TABLE IF NOT EXISTS ${schema.table} (
                    ${schema.columns.map(col => `${col.name} ${col.type}${col.isPrimaryKey ? ' PRIMARY KEY' : ''}`).join(',\n    ')}
                );`;
                
                await pgPool.query(
                    `INSERT INTO assignment_tables (assignment_id, table_name, create_statement) 
                     VALUES ($1, $2, $3)
                     ON CONFLICT (id) DO NOTHING`,
                    [
                        assignment._id.toString(),
                        schema.table,
                        createStatement
                    ]
                );
            }
        }
        console.log('✅ Assignments linked to PostgreSQL tables');

        console.log('\n✅✅✅ SEEDING COMPLETE! ✅✅✅');
        console.log('\n📋 ====== CREDENTIALS ======');
        console.log('Admin:    admin@example.com / admin123');
        console.log('Student:  student@example.com / student123');
        console.log('============================\n');

        // Verify
        const assignmentCount = await Assignment.countDocuments();
        const userCount = await User.countDocuments();
        console.log(`📊 Verification: ${assignmentCount} assignments, ${userCount} users`);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        await pgPool.end();
        process.exit(0);
    }
}

// Run seeding
seedDatabase();