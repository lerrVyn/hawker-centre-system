// Lervyn Ang
// SA-210: Complaint status tracking.
// - Customer: view own complaints with current status, newest updated first.
// - Stall owner: update status of a complaint against their own stall.
//   (Case study calls this actor "the operator", but there's no operator
//   table in our schema - only stall_owners, nea_officers, customers - so
//   this is scoped to stall owner. Flag this mapping when you present SA-210.)
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const Joi = require("joi");
const dbConfig = require("../dbConfig");
const verifyToken = require("../middleware/authMiddleware");
const verifyOwnerToken = require("../middleware/authOwnerMiddleware");

const ALLOWED_STATUSES = ["Pending", "Under Review", "Resolved"];

const statusSchema = Joi.object({
  status: Joi.string().valid(...ALLOWED_STATUSES).required(),
});

/**
 * SA-210: READ - the logged-in customer's own complaints with status.
 */
router.get("/my", verifyToken, async (req, res) => {
  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("customer_id", sql.Int, customer_id)
      .query(
        `SELECT complaint_id, stall_id, category, description, status, created_at, updated_at
         FROM complaints
         WHERE customer_id = @customer_id
         ORDER BY updated_at DESC`
      );

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching your complaints" });
  }
});

/**
 * SA-210: UPDATE - stall owner updates status of a complaint on their stall.
 */
router.patch("/:id/status", verifyOwnerToken, async (req, res) => {
  const complaint_id = parseInt(req.params.id);
  if (isNaN(complaint_id)) return res.status(400).json({ error: "Invalid complaint id" });

  const { error, value } = statusSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const owner_id = req.owner.owner_id;

  try {
    const pool = await sql.connect(dbConfig);

    const existing = await pool
      .request()
      .input("complaint_id", sql.Int, complaint_id)
      .query(
        `SELECT c.*, s.owner_id AS stall_owner_id
         FROM complaints c
         JOIN stalls s ON c.stall_id = s.stall_id
         WHERE c.complaint_id = @complaint_id`
      );

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    if (existing.recordset[0].stall_owner_id !== owner_id) {
      return res.status(403).json({ error: "You can only update complaints for your own stall" });
    }

    await pool
      .request()
      .input("complaint_id", sql.Int, complaint_id)
      .input("status", sql.NVarChar, value.status)
      .query(
        `UPDATE complaints SET status = @status, updated_at = GETDATE()
         WHERE complaint_id = @complaint_id`
      );

    res.json({ message: "Complaint status updated", status: value.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating complaint status" });
  }
});

module.exports = router;