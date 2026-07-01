const express = require("express");
const sql = require('mssql');
const dotenv = require("dotenv");
dotenv.config();

const dbConfig = require("./dbConfig");
const app = express();



app.use(express.json());
const PORT = process.env.PORT || 3000;

// Routes
// const feedbackRouter = require('./routes/feedback');
// app.use('/feedback', feedbackRouter);
app.get("/", (req, res) => {
  res.send("Hello, world!");
});



// Start server
app.listen(PORT, async () => {
  try {
    // Connect to the database
    await sql.connect(dbConfig);
    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }

  console.log(`Server listening on port ${PORT}`);
});