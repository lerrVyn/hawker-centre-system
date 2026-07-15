// Lervyn Ang
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const Joi = require("joi");
const dbConfig = require("../dbConfig");
const verifyToken = require("../middleware/authMiddleware");

const feedbackSchema = Joi.object({
  stall_id: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  // A rating alone is not a useful written review; reject whitespace too.
  comment: Joi.string().trim().min(1).max(500).required(),
});

// CREATE - submit feedback for a stall (SA-37, protected)
router.post("/", verifyToken, async (req, res) => {
  const { error, value } = feedbackSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { stall_id, rating, comment } = value;
  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);

    const stallCheck = await pool
      .request()
      .input("stall_id", sql.Int, stall_id)
      .query("SELECT stall_id FROM stalls WHERE stall_id = @stall_id");

    if (stallCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Stall not found" });
    }

    const result = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .input("stall_id", sql.Int, stall_id)
      .input("rating", sql.Int, rating)
      .input("comment", sql.NVarChar, comment || null)
      .query(
        `INSERT INTO feedback (customer_id, stall_id, rating, comment, created_at)
         OUTPUT INSERTED.*
         VALUES (@customer_id, @stall_id, @rating, @comment, GETDATE())`
      );

    res.status(201).json({ message: "Feedback submitted", feedback: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error submitting feedback" });
  }
});

// READ - all feedback for a stall (public)
router.get("/stall/:stall_id", async (req, res) => {
  const stall_id = parseInt(req.params.stall_id);
  if (isNaN(stall_id)) return res.status(400).json({ error: "Invalid stall_id" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("stall_id", sql.Int, stall_id)
      .query(
        `SELECT f.feedback_id, c.name AS customer_name, f.rating, f.comment, f.created_at
         FROM feedback f
         JOIN customers c ON f.customer_id = c.customer_id
         WHERE f.stall_id = @stall_id
         ORDER BY f.created_at DESC`
      );

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching feedback" });
  }
});

// READ - single feedback by id (public)
router.get("/:id", async (req, res) => {
  const feedback_id = parseInt(req.params.id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT * FROM feedback WHERE feedback_id = @feedback_id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching feedback" });
  }
});

// UPDATE - edit own feedback (protected, owner-only)
router.put("/:id", verifyToken, async (req, res) => {
  const feedback_id = parseInt(req.params.id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  const { error, value } = feedbackSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { rating, comment } = value;
  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);

    const existing = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT * FROM feedback WHERE feedback_id = @feedback_id");

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    if (existing.recordset[0].customer_id !== customer_id) {
      return res.status(403).json({ error: "You can only edit your own feedback" });
    }

    await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .input("rating", sql.Int, rating)
      .input("comment", sql.NVarChar, comment || null)
      .query(
        "UPDATE feedback SET rating = @rating, comment = @comment WHERE feedback_id = @feedback_id"
      );

    res.json({ message: "Feedback updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating feedback" });
  }
});

// DELETE - remove own feedback (protected, owner-only)
router.delete("/:id", verifyToken, async (req, res) => {
  const feedback_id = parseInt(req.params.id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);

    const existing = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT * FROM feedback WHERE feedback_id = @feedback_id");

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    if (existing.recordset[0].customer_id !== customer_id) {
      return res.status(403).json({ error: "You can only delete your own feedback" });
    }

    await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("DELETE FROM feedback WHERE feedback_id = @feedback_id");

    res.json({ message: "Feedback deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting feedback" });
  }
});

module.exports = router;
