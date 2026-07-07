const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require("../dbConfig");

// GET all stalls (public, needed for frontend dropdowns)
router.get("/stalls", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM stalls");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching stalls" });
  }
});

// GET menu items for a specific stall (public)
router.get("/menu-items/:stall_id", async (req, res) => {
  const stall_id = parseInt(req.params.stall_id);
  if (isNaN(stall_id)) return res.status(400).json({ error: "Invalid stall_id" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("stall_id", sql.Int, stall_id)
      .query("SELECT * FROM menu_items WHERE stall_id = @stall_id");
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching menu items" });
  }
});

module.exports = router;