// Lervyn Ang
// SA-170: Stall owner views customer feedback and complaints for their
// own stall(s), with optional date filtering.
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require("../dbConfig");
const verifyOwnerToken = require("../middleware/authOwnerMiddleware");

function parseDateRange(req) {
  const from = req.query.from && !isNaN(Date.parse(req.query.from)) ? req.query.from : null;
  const to = req.query.to && !isNaN(Date.parse(req.query.to)) ? req.query.to : null;
  return { from, to };
}

/**
 * SA-170: READ - feedback for all stalls owned by the logged-in owner.
 */
router.get("/feedback", verifyOwnerToken, async (req, res) => {
  const owner_id = req.owner.owner_id;
  const { from, to } = parseDateRange(req);

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("owner_id", sql.Int, owner_id)
      .input("from_date", sql.Date, from)
      .input("to_date", sql.Date, to)
      .query(
        `SELECT f.feedback_id, f.stall_id, s.stall_name, c.name AS customer_name,
                f.rating, f.comment, f.created_at
         FROM feedback f
         JOIN stalls s ON f.stall_id = s.stall_id
         JOIN customers c ON f.customer_id = c.customer_id
         WHERE s.owner_id = @owner_id
           AND (@from_date IS NULL OR f.created_at >= @from_date)
           AND (@to_date IS NULL OR f.created_at < DATEADD(day, 1, @to_date))
         ORDER BY f.created_at DESC`
      );

    res.json({ count: result.recordset.length, feedback: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching feedback" });
  }
});

/**
 * SA-170: READ - complaints for all stalls owned by the logged-in owner.
 */
router.get("/complaints", verifyOwnerToken, async (req, res) => {
  const owner_id = req.owner.owner_id;
  const { from, to } = parseDateRange(req);
  const status = ["Pending", "Under Review", "Resolved"].includes(req.query.status)
    ? req.query.status
    : null;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("owner_id", sql.Int, owner_id)
      .input("from_date", sql.Date, from)
      .input("to_date", sql.Date, to)
      .input("status", sql.NVarChar, status)
      .query(
        `SELECT co.complaint_id, co.stall_id, s.stall_name, cu.name AS customer_name,
                co.category, co.description, co.status, co.created_at, co.updated_at
         FROM complaints co
         JOIN stalls s ON co.stall_id = s.stall_id
         JOIN customers cu ON co.customer_id = cu.customer_id
         WHERE s.owner_id = @owner_id
           AND (@from_date IS NULL OR co.created_at >= @from_date)
           AND (@to_date IS NULL OR co.created_at < DATEADD(day, 1, @to_date))
           AND (@status IS NULL OR co.status = @status)
         ORDER BY co.updated_at DESC`
      );

    res.json({ count: result.recordset.length, complaints: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching complaints" });
  }
});

module.exports = router;