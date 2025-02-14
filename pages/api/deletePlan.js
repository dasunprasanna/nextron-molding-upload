import { connectToDatabase } from "../../db1"; // Import your database connection function
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Extract necessary data from request
  const { date } = req.body;

  // Validate date
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ message: "Invalid or missing date. Expected format: YYYY-MM-DD" });
  }

  try {
    // Connect to the database
    const pool = await connectToDatabase();

    // Execute the delete query
    const result = await pool
      .request()
      .input("Date", sql.Date, new Date(date)) // Convert to Date object
      .query("DELETE FROM MoldingPlan WHERE Date = @Date");

    // Check if the row was deleted successfully
    if (result.rowsAffected[0] > 0) {
      return res.status(200).json({ message: "Data successfully deleted" });
    } else {
      return res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    console.error("Error deleting row:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
