const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "quickbook-test.database.windows.net",
  database: "qbdb",
  options: {
    encrypt: true,     // required by azure
    trustServerCertificate: false
  },
};

async function main() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT TOP 3 name FROM sys.databases");
    console.dir(result);
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

main();