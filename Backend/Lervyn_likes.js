const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET total likes for a menu item
// URL: GET /likes/:itemId
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const pool = await sql.connect();
    const result = await pool.request()
      .input('itemId', sql.Int, itemId)
      .query(`
        SELECT 
          m.item_name,
          COUNT(l.like_id) AS total_likes
        FROM menu_items m
        LEFT JOIN likes l ON m.item_id = l.item_id
        WHERE m.item_id = @itemId
        GROUP BY m.item_name
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST like a menu item
// URL: POST /likes
router.post('/', async (req, res) => {
  try {
    const { customer_id, item_id } = req.body;

    // Validation
    if (!customer_id || !item_id) {
      return res.status(400).json({ error: 'customer_id and item_id are required' });
    }

    const pool = await sql.connect();

    // Check if customer exists
    const customerCheck = await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .query('SELECT customer_id FROM customers WHERE customer_id = @customer_id');
    if (customerCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if menu item exists
    const itemCheck = await pool.request()
      .input('item_id', sql.Int, item_id)
      .query('SELECT item_id FROM menu_items WHERE item_id = @item_id');
    if (itemCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check for duplicate like
    const duplicateCheck = await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .input('item_id', sql.Int, item_id)
      .query(`
        SELECT like_id FROM likes 
        WHERE customer_id = @customer_id AND item_id = @item_id
      `);
    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({ error: 'You have already liked this item' });
    }

    // Insert like
    await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .input('item_id', sql.Int, item_id)
      .query(`
        INSERT INTO likes (customer_id, item_id)
        VALUES (@customer_id, @item_id)
      `);

    res.status(201).json({ message: 'Menu item liked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE unlike a menu item
// URL: DELETE /likes
router.delete('/', async (req, res) => {
  try {
    const { customer_id, item_id } = req.body;

    if (!customer_id || !item_id) {
      return res.status(400).json({ error: 'customer_id and item_id are required' });
    }

    const pool = await sql.connect();

    // Check if like exists
    const likeCheck = await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .input('item_id', sql.Int, item_id)
      .query(`
        SELECT like_id FROM likes
        WHERE customer_id = @customer_id AND item_id = @item_id
      `);
    if (likeCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Delete like
    await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .input('item_id', sql.Int, item_id)
      .query(`
        DELETE FROM likes
        WHERE customer_id = @customer_id AND item_id = @item_id
      `);

    res.status(200).json({ message: 'Menu item unliked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;