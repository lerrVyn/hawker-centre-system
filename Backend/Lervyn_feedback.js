const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET all feedback for a stall
// URL: GET /feedback/:stallId
router.get('/:stallId', async (req, res) => {
  try {
    const { stallId } = req.params;
    const pool = await sql.connect();
    const result = await pool.request()
      .input('stallId', sql.Int, stallId)
      .query(`
        SELECT 
          f.feedback_id,
          c.name AS customer_name,
          f.rating,
          f.comment,
          f.created_at,
          AVG(f.rating) OVER (PARTITION BY f.stall_id) AS average_rating
        FROM feedback f
        JOIN customers c ON f.customer_id = c.customer_id
        WHERE f.stall_id = @stallId
        ORDER BY f.created_at DESC
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No feedback found for this stall' });
    }

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new feedback for a stall
// URL: POST /feedback
router.post('/', async (req, res) => {
  try {
    const { customer_id, stall_id, rating, comment } = req.body;

    // Validation
    if (!customer_id || !stall_id || !rating) {
      return res.status(400).json({ error: 'customer_id, stall_id and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const pool = await sql.connect();

    // Check if customer exists
    const customerCheck = await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .query('SELECT customer_id FROM customers WHERE customer_id = @customer_id');
    if (customerCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if stall exists
    const stallCheck = await pool.request()
      .input('stall_id', sql.Int, stall_id)
      .query('SELECT stall_id FROM stalls WHERE stall_id = @stall_id');
    if (stallCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    // Insert feedback
    await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .input('stall_id', sql.Int, stall_id)
      .input('rating', sql.Int, rating)
      .input('comment', sql.NVarChar, comment || null)
      .query(`
        INSERT INTO feedback (customer_id, stall_id, rating, comment)
        VALUES (@customer_id, @stall_id, @rating, @comment)
      `);

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;