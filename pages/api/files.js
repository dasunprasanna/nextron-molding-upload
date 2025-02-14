import { connectToDatabase } from '../../db1';

export default async function handler(req, res) {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT DISTINCT Date FROM MoldingPlan ORDER BY Date DESC');
    console.log("fetching successfull")
    await pool.close();

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}