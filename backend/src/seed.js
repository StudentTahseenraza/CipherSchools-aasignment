import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Assignment } from './models/mongodb/Assignment.model.js';

dotenv.config();

const sampleAssignments = [
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
      { text: "Use the WHERE clause to filter by department", order: 1 },
      { text: "Remember to specify only the columns asked for", order: 2 },
      { text: "Department names are case-sensitive", order: 3 }
    ],
    solution: "SELECT first_name, last_name, salary FROM employees WHERE department = 'Sales';",
    isActive: true,
    metadata: {
      estimatedTime: 10,
      successRate: 0,
      totalAttempts: 0
    }
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
      { text: "Consider which type of JOIN you need", order: 1 },
      { text: "LEFT JOIN will include all customers", order: 2 },
      { text: "Think about which columns to use for joining", order: 3 }
    ],
    solution: "SELECT c.name, o.order_date, o.total_amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id ORDER BY c.name;",
    isActive: true,
    metadata: {
      estimatedTime: 15,
      successRate: 0,
      totalAttempts: 0
    }
  },
  {
    title: "Aggregate Functions",
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
      { text: "Use EXTRACT or TO_CHAR for month extraction", order: 1 },
      { text: "GROUP BY is essential here", order: 2 },
      { text: "SUM() will help calculate totals", order: 3 },
      { text: "Don't forget to filter for year 2023", order: 4 }
    ],
    solution: "SELECT TO_CHAR(sale_date, 'Month') as month, SUM(total_amount) as total FROM sales WHERE EXTRACT(YEAR FROM sale_date) = 2023 GROUP BY TO_CHAR(sale_date, 'Month'), EXTRACT(MONTH FROM sale_date) ORDER BY EXTRACT(MONTH FROM sale_date);",
    isActive: true,
    metadata: {
      estimatedTime: 20,
      successRate: 0,
      totalAttempts: 0
    }
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing assignments
    await Assignment.deleteMany({});
    console.log('Cleared existing assignments');

    // Insert sample assignments
    const result = await Assignment.insertMany(sampleAssignments);
    console.log(`Inserted ${result.length} sample assignments`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();