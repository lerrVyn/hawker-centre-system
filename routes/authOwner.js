const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const dbConfig = require("../dbConfig");

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

router.post("/login", async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }

  const { email, password } = value;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT owner_id,name,email,password_hash
        FROM stall_owners
        WHERE email=@email
      `);

    console.log("================================");
    console.log("EMAIL ENTERED:", email);
    console.log("PASSWORD ENTERED:", password);
    console.log("ROWS FOUND:", result.recordset.length);

    if (result.recordset.length === 0) {
      console.log("NO OWNER FOUND");
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const owner = result.recordset[0];

    console.log("OWNER:", owner);
    console.log("HASH FROM DB:", owner.password_hash);

    const match = await bcrypt.compare(
      password,
      owner.password_hash
    );

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        owner_id: owner.owner_id,
        email: owner.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    return res.json({
      message: "Login successful",
      token,
      owner: {
        owner_id: owner.owner_id,
        name: owner.name,
        email: owner.email
      }
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;