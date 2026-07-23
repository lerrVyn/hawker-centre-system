// Lervyn Ang
// SA-212: Stall owner replies to customer feedback.
// One reply per feedback entry (owner edits/deletes it, doesn't stack replies).
const express = require("express");
const router = express.Router();
const sql = require("mssql");
const Joi = require("joi");
const dbConfig = require("../dbConfig");
const verifyOwnerToken = require("../middleware/authOwnerMiddleware");

const replySchema = Joi.object({
  reply_text: Joi.string().trim().min(1).max(500).required(),
});

async function getOwnedFeedback(pool, feedback_id, owner_id) {
  const result = await pool
    .request()
    .input("feedback_id", sql.Int, feedback_id)
    .query(
      `SELECT f.feedback_id, s.owner_id AS stall_owner_id
       FROM feedback f
       JOIN stalls s ON f.stall_id = s.stall_id
       WHERE f.feedback_id = @feedback_id`
    );

  const row = result.recordset[0];
  if (!row) return { found: false, owned: false };
  return { found: true, owned: row.stall_owner_id === owner_id };
}

/**
 * SA-212: CREATE - owner replies to a feedback entry on their stall.
 */
router.post("/:feedback_id", verifyOwnerToken, async (req, res) => {
  const feedback_id = parseInt(req.params.feedback_id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  const { error, value } = replySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const owner_id = req.owner.owner_id;

  try {
    const pool = await sql.connect(dbConfig);
    const { found, owned } = await getOwnedFeedback(pool, feedback_id, owner_id);

    if (!found) return res.status(404).json({ error: "Feedback not found" });
    if (!owned) return res.status(403).json({ error: "You can only reply to feedback on your own stall" });

    const existingReply = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT reply_id FROM feedback_replies WHERE feedback_id = @feedback_id");

    if (existingReply.recordset.length > 0) {
      return res.status(409).json({ error: "A reply already exists for this feedback. Use PUT to edit it." });
    }

    const result = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .input("owner_id", sql.Int, owner_id)
      .input("reply_text", sql.NVarChar, value.reply_text)
      .query(
        `INSERT INTO feedback_replies (feedback_id, owner_id, reply_text, created_at, updated_at)
         OUTPUT INSERTED.*
         VALUES (@feedback_id, @owner_id, @reply_text, GETDATE(), GETDATE())`
      );

    res.status(201).json({ message: "Reply posted", reply: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error posting reply" });
  }
});

/**
 * READ - the reply for a feedback entry, if any (public).
 */
router.get("/:feedback_id", async (req, res) => {
  const feedback_id = parseInt(req.params.feedback_id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT * FROM feedback_replies WHERE feedback_id = @feedback_id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "No reply for this feedback yet" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching reply" });
  }
});

/**
 * SA-212: UPDATE - owner edits their own reply.
 */
router.put("/:feedback_id", verifyOwnerToken, async (req, res) => {
  const feedback_id = parseInt(req.params.feedback_id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  const { error, value } = replySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const owner_id = req.owner.owner_id;

  try {
    const pool = await sql.connect(dbConfig);
    const existing = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT * FROM feedback_replies WHERE feedback_id = @feedback_id");

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: "Reply not found" });
    }
    if (existing.recordset[0].owner_id !== owner_id) {
      return res.status(403).json({ error: "You can only edit your own reply" });
    }

    await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .input("reply_text", sql.NVarChar, value.reply_text)
      .query(
        `UPDATE feedback_replies SET reply_text = @reply_text, updated_at = GETDATE()
         WHERE feedback_id = @feedback_id`
      );

    res.json({ message: "Reply updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating reply" });
  }
});

/**
 * SA-212: DELETE - owner deletes their own reply.
 */
router.delete("/:feedback_id", verifyOwnerToken, async (req, res) => {
  const feedback_id = parseInt(req.params.feedback_id);
  if (isNaN(feedback_id)) return res.status(400).json({ error: "Invalid feedback id" });

  const owner_id = req.owner.owner_id;

  try {
    const pool = await sql.connect(dbConfig);
    const existing = await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("SELECT * FROM feedback_replies WHERE feedback_id = @feedback_id");

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: "Reply not found" });
    }
    if (existing.recordset[0].owner_id !== owner_id) {
      return res.status(403).json({ error: "You can only delete your own reply" });
    }

    await pool
      .request()
      .input("feedback_id", sql.Int, feedback_id)
      .query("DELETE FROM feedback_replies WHERE feedback_id = @feedback_id");

    res.json({ message: "Reply deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting reply" });
  }
});

module.exports = router;