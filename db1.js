import sql from "mssql";

const config = {
  user: "usrAuto",
  password: "vwAut*^zvhQH*Ara",
  server: "sg-prod-bdydbs1.database.windows.net", // MSSQL server hostname or IP address
  //server: "10.223.2.210",
  database: "SG-PROD-BDYDB-AUTO",
  options: {
    encrypt: true, // Set to true if your MSSQL server requires encrypted connections
  },
  requestTimeout: 60000, // 60 seconds
  connectionTimeout: 30000, // 30 seconds
};

// Function to connect to the database
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(config);
    console.log("Database connected successfully");
    return pool;
  } catch (error) {
    console.error("Error connecting to database:", error.message || error);
    throw error;
  }
}

// Function to close the database connection
export async function closeDatabaseConnection(pool) {
  try {
      await pool.close();
      console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error.message || error);
    throw error;
  }
}