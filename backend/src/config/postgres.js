import pkg from "pg";
const { Pool } = pkg;

export const createPostgresPools = () => {

  const isProduction = process.env.NODE_ENV === "production";

  // ===============================
  // WRITE POOL (Admin Operations)
  // ===============================
  const writePool = new Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    database: process.env.PG_DB_NAME,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,

    // 🔐 Required for Supabase / Production
    ssl: isProduction
      ? { rejectUnauthorized: false }
      : false,
  });


  // ==================================
  // READ-ONLY POOL (User SQL Sandbox)
  // ==================================
  const readOnlyPool = new Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    database: process.env.PG_DB_NAME,
    user: process.env.PG_READONLY_USER,
    password: process.env.PG_READONLY_PASSWORD,

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,

    ssl: isProduction
      ? { rejectUnauthorized: false }
      : false,
  });


  // ===============================
  // Test Connections (Clean Version)
  // ===============================
  writePool.on("connect", () => {
    console.log("✅ PostgreSQL write pool connected");
  });

  writePool.on("error", (err) => {
    console.error("❌ PostgreSQL write pool error:", err.message);
  });

  readOnlyPool.on("connect", async (client) => {
    console.log("✅ PostgreSQL read-only pool connected");

    try {
      await client.query("SET default_transaction_read_only = ON");
      await client.query("SET statement_timeout = 5000");
    } catch (err) {
      console.error("⚠ Error setting read-only session configs:", err.message);
    }
  });

  readOnlyPool.on("error", (err) => {
    console.error("❌ PostgreSQL read-only pool error:", err.message);
  });

  return { writePool, readOnlyPool };
};


// ==================================
// Helper: Test PostgreSQL Connection
// ==================================
export const testPostgresConnection = async () => {
  const { writePool } = createPostgresPools();

  try {
    const result = await writePool.query("SELECT NOW() as current_time");

    return {
      success: true,
      time: result.rows[0].current_time,
      message: "PostgreSQL connection successful",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "PostgreSQL connection failed",
    };
  }
};