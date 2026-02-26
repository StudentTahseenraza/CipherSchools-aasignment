-- Create database
CREATE DATABASE ciphersqlstudio;

\c ciphersqlstudio;

-- Create read-only user for query execution
CREATE USER sql_reader WITH PASSWORD 'readonly123';
GRANT CONNECT ON DATABASE ciphersqlstudio TO sql_reader;
GRANT USAGE ON SCHEMA public TO sql_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sql_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO sql_reader;

-- Users table (for optional auth feature)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(50),
    question_text TEXT NOT NULL,
    table_schemas JSONB NOT NULL,
    sample_data_queries JSONB,
    hints TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignment tables data
CREATE TABLE assignment_tables (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    create_statement TEXT NOT NULL,
    sample_data JSONB
);

-- User attempts (for optional feature)
CREATE TABLE user_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    sql_query TEXT NOT NULL,
    execution_time INTEGER,
    rows_returned INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample assignments
INSERT INTO assignments (title, description, difficulty, category, question_text, table_schemas, hints) VALUES
(
    'Basic SELECT from Employees',
    'Learn to retrieve data from an employee table',
    'Easy',
    'Basic Queries',
    'Write a query to display all employees who work in the ''Sales'' department. Include their first name, last name, and salary.',
    '[
        {
            "table": "employees",
            "columns": [
                {"name": "id", "type": "INTEGER"},
                {"name": "first_name", "type": "VARCHAR(50)"},
                {"name": "last_name", "type": "VARCHAR(50)"},
                {"name": "email", "type": "VARCHAR(100)"},
                {"name": "department", "type": "VARCHAR(50)"},
                {"name": "salary", "type": "DECIMAL(10,2)"},
                {"name": "hire_date", "type": "DATE"}
            ]
        }
    ]'::jsonb,
    ARRAY['Use the WHERE clause to filter by department', 'Remember to specify the columns you want to display']
),
(
    'JOIN Orders and Customers',
    'Practice using JOIN operations',
    'Medium',
    'Joins',
    'Show all orders with customer names and order dates. Include customers who haven''t placed any orders.',
    '[
        {
            "table": "customers",
            "columns": [
                {"name": "id", "type": "INTEGER"},
                {"name": "name", "type": "VARCHAR(100)"},
                {"name": "email", "type": "VARCHAR(100)"},
                {"name": "city", "type": "VARCHAR(50)"}
            ]
        },
        {
            "table": "orders",
            "columns": [
                {"name": "id", "type": "INTEGER"},
                {"name": "customer_id", "type": "INTEGER"},
                {"name": "order_date", "type": "DATE"},
                {"name": "total_amount", "type": "DECIMAL(10,2)"},
                {"name": "status", "type": "VARCHAR(20)"}
            ]
        }
    ]'::jsonb,
    ARRAY['Consider which type of JOIN you need (LEFT JOIN might be useful)', 'Think about which columns to use for joining']
),
(
    'Aggregate Functions',
    'Learn to use GROUP BY and aggregate functions',
    'Medium',
    'Aggregation',
    'Calculate the total sales amount per month for the year 2023. Show month name and total.',
    '[
        {
            "table": "sales",
            "columns": [
                {"name": "id", "type": "INTEGER"},
                {"name": "product_id", "type": "INTEGER"},
                {"name": "sale_date", "type": "DATE"},
                {"name": "quantity", "type": "INTEGER"},
                {"name": "unit_price", "type": "DECIMAL(10,2)"},
                {"name": "total_amount", "type": "DECIMAL(10,2)"}
            ]
        }
    ]'::jsonb,
    ARRAY['Use EXTRACT or TO_CHAR for month extraction', 'GROUP BY is essential here', 'SUM() will help calculate totals']
);

-- Create sample tables for assignments
-- Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    hire_date DATE
);

INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES
('John', 'Doe', 'john.doe@company.com', 'Sales', 75000.00, '2020-01-15'),
('Jane', 'Smith', 'jane.smith@company.com', 'Sales', 82000.00, '2019-03-20'),
('Bob', 'Johnson', 'bob.johnson@company.com', 'IT', 90000.00, '2018-06-10'),
('Alice', 'Williams', 'alice.williams@company.com', 'HR', 65000.00, '2021-02-01'),
('Charlie', 'Brown', 'charlie.brown@company.com', 'Sales', 70000.00, '2022-07-15'),
('Diana', 'Miller', 'diana.miller@company.com', 'IT', 95000.00, '2017-11-30'),
('Eve', 'Davis', 'eve.davis@company.com', 'Marketing', 72000.00, '2020-09-12'),
('Frank', 'Wilson', 'frank.wilson@company.com', 'Sales', 78000.00, '2021-04-05');

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    city VARCHAR(50)
);

INSERT INTO customers (name, email, city) VALUES
('Tech Corp', 'contact@techcorp.com', 'San Francisco'),
('Global Solutions', 'info@globalsolutions.com', 'New York'),
('Local Shop', 'owner@localshop.com', 'Austin'),
('Mega Retail', 'sales@megaretail.com', 'Chicago'),
('Small Biz', 'hello@smallbiz.com', 'Miami'),
('Enterprise Ltd', 'contact@enterprise.com', 'Seattle');

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20)
);

INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES
(1, '2024-01-15', 1500.00, 'completed'),
(2, '2024-01-20', 2300.50, 'completed'),
(1, '2024-02-01', 800.00, 'completed'),
(3, '2024-02-10', 350.75, 'pending'),
(4, '2024-02-15', 4200.00, 'completed'),
(2, '2024-03-01', 1800.00, 'shipped'),
(5, '2024-03-05', 250.00, 'pending'),
(1, '2024-03-10', 3200.00, 'completed'),
(6, '2024-03-15', 5600.00, 'completed');

-- Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    sale_date DATE,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2)
);

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
(102, '2023-04-15', 4, 45.00, 180.00);