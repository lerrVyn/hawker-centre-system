// Lervyn Ang
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const Joi = require("joi");
const dbConfig = require("../dbConfig");
const verifyToken = require("../middleware/authMiddleware");

const likeSchema = Joi.object({
  item_id: Joi.number().integer().required(),
});

// CREATE - like a menu item (SA-38, protected)
router.post("/", verifyToken, async (req, res) => {
  const { error, value } = likeSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { item_id } = value;
  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);

    const itemCheck = await pool
      .request()
      .input("item_id", sql.Int, item_id)
      .query("SELECT item_id FROM menu_items WHERE item_id = @item_id");

    if (itemCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const existing = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("item_id", sql.Int, item_id)
      .query("SELECT like_id FROM likes WHERE customer_id = @customer_id AND item_id = @item_id");

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: "You already liked this item" });
    }

    const result = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("item_id", sql.Int, item_id)
      .query(
        `INSERT INTO likes (customer_id, item_id, created_at)
         OUTPUT INSERTED.*
         VALUES (@customer_id, @item_id, GETDATE())`
      );

    res.status(201).json({ message: "Item liked", like: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error liking item" });
  }
});

// READ - all likes for a menu item, with count (public)
router.get("/item/:item_id", async (req, res) => {
  const item_id = parseInt(req.params.item_id);
  if (isNaN(item_id)) return res.status(400).json({ error: "Invalid item_id" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("item_id", sql.Int, item_id)
      .query(
        `SELECT l.like_id, c.name AS customer_name, l.created_at
         FROM likes l
         JOIN customers c ON l.customer_id = c.customer_id
         WHERE l.item_id = @item_id
         ORDER BY l.created_at DESC`
      );

    res.json({ count: result.recordset.length, likes: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching likes" });
  }
});

// READ - all items liked by the logged-in customer (protected)
router.get("/my-likes", verifyToken, async (req, res) => {
  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(
        `SELECT l.like_id, mi.item_id, mi.item_name, mi.price, l.created_at
         FROM likes l
         JOIN menu_items mi ON l.item_id = mi.item_id
         WHERE l.customer_id = @customer_id
         ORDER BY l.created_at DESC`
      );

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching your likes" });
  }
});

// DELETE - unlike an item (protected)
router.delete("/:item_id", verifyToken, async (req, res) => {
  const item_id = parseInt(req.params.item_id);
  if (isNaN(item_id)) return res.status(400).json({ error: "Invalid item_id" });

  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);

    const existing = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("item_id", sql.Int, item_id)
      .query("SELECT like_id FROM likes WHERE customer_id = @customer_id AND item_id = @item_id");

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: "Like not found" });
    }

    await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("item_id", sql.Int, item_id)
      .query("DELETE FROM likes WHERE customer_id = @customer_id AND item_id = @item_id");

    res.json({ message: "Item unliked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error unliking item" });
  }
});

module.exports = router;