// Lervyn Ang
// SA-39: Submit complaint about a food stall.
// Status tracking (SA-210) lives in complaintStatus.js - separate lifecycle
// concern (operator/owner updating status) on the same table.
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const Joi = require("joi");
const dbConfig = require("../dbConfig");
const verifyToken = require("../middleware/authMiddleware");

const ALLOWED_CATEGORIES = ["Hygiene", "Food Quality", "Service", "Overcharging", "Other"];

const complaintSchema = Joi.object({
  stall_id: Joi.number().integer().required(),
  category: Joi.string().valid(...ALLOWED_CATEGORIES).required(),
  description: Joi.string().trim().min(10).max(500).required(),
});

// Third-party API integration (PurgoMalum - free, no API key required).
// Blocks complaints containing profanity before they hit the DB / an
// operator's inbox. Fails OPEN if the service is unreachable, so a network
// hiccup on their end never blocks a genuine complaint.
async function containsProfanity(text) {
  const url = `https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  const result = (await response.text()).trim();
  return result === "true";
}

/**
 * SA-39: CREATE - lodge a complaint against a stall (protected)
 */
router.post("/", verifyToken, async (req, res) => {
  const { error, value } = complaintSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { stall_id, category, description } = value;
  const customer_id = req.user.customer_id;

  try {
    let flagged = false;
    try {
      flagged = await containsProfanity(description);
    } catch (moderationErr) {
      console.error("Profanity-check API unreachable, allowing complaint through:", moderationErr.message);
    }

    if (flagged) {
      return res.status(400).json({
        error: "Please remove inappropriate language from your complaint description and try again.",
      });
    }

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
      .input("category", sql.NVarChar, category)
      .input("description", sql.NVarChar, description)
      .query(
        `INSERT INTO complaints (customer_id, stall_id, category, description, status, created_at, updated_at)
         OUTPUT INSERTED.*
         VALUES (@customer_id, @stall_id, @category, @description, 'Pending', GETDATE(), GETDATE())`
      );

    res.status(201).json({ message: "Complaint submitted", complaint: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error submitting complaint" });
  }
});

/**
 * READ - a single complaint by id (protected, owner-of-complaint only)
 */
router.get("/:id", verifyToken, async (req, res) => {
  const complaint_id = parseInt(req.params.id);
  if (isNaN(complaint_id)) return res.status(400).json({ error: "Invalid complaint id" });

  const customer_id = req.user.customer_id;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("complaint_id", sql.Int, complaint_id)
      .query("SELECT * FROM complaints WHERE complaint_id = @complaint_id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    if (result.recordset[0].customer_id !== customer_id) {
      return res.status(403).json({ error: "You can only view your own complaints" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching complaint" });
  }
});

module.exports = router;