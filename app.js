const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
dotenv.config();

const dbConfig = require("./dbConfig");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); // serves frontend/index.html at "/"

const PORT = process.env.PORT || 3000;

// Routes
const authRouter = require("./routes/auth");
const feedbackRouter = require("./routes/feedback");
const likesRouter = require("./routes/likes");
const catalogRouter = require("./routes/catalog");

app.use("/auth", authRouter);
app.use("/feedback", feedbackRouter);
app.use("/likes", likesRouter);
app.use("/catalog", catalogRouter);

app.get("/api", (req, res) => {
  res.send("Hawker Centre API is running.");
});

app.listen(PORT, async () => {
  try {
    await sql.connect(dbConfig);
    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }

  console.log(`Server listening on port ${PORT}`);
});