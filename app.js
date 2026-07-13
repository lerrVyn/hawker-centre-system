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
const gradeRouter = require("./routes/grade");
const inspectionRouter = require("./routes/inspection");
const customerAuthRouter = require("./routes/authCust");
const catalogCustRouter = require("./routes/catalogCust");
const profileRouter = require("./routes/profile");
const menuRouter = require("./routes/menu");
const promotionRouter = require("./routes/promotions");

app.use("/auth", authRouter);
app.use("/feedback", feedbackRouter);
app.use("/likes", likesRouter);
app.use("/catalog", catalogRouter);
app.use("/grade", gradeRouter);
app.use("/inspection", inspectionRouter);
app.use("/auth/customer", customerAuthRouter);
app.use("/catalog/customer", catalogCustRouter);
app.use("/profile", profileRouter);
app.use("/menu", menuRouter);
app.use("/promotion", promotionRouter);

app.get("/api", (req, res) => {
  res.send("Hawker Centre API is running.");
});


// Start server
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


