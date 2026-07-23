const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const dbConfig = require("./dbConfig");

// Route imports
const authCustRouter = require("./routes/authCust");
const authOfficerRouter = require("./routes/authOfficer");
const feedbackRouter = require("./routes/feedback");
const likesRouter = require("./routes/likes");
const catalogRouter = require("./routes/catalog");
const gradeRouter = require("./routes/grade");
const inspectionRouter = require("./routes/inspection");
const officerRouter = require("./routes/neaOfficer");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const paymentRouter = require("./routes/payment");
const catalogCustRouter = require("./routes/catalogCust");
const menuRouter = require("./routes/menu");
const profileCustRoutes = require("./routes/profileCust");
const dashboardRoutes = require("./routes/dashboard");
const authOwnerRouter = require("./routes/authOwner");
const feedbackRepliesRouter = require("./routes/feedbackReplies");
const complaintsRouter = require("./routes/complaints");
const complaintStatusRouter = require("./routes/complaintStatus");
const ownerFeedbackRouter = require("./routes/ownerFeedback");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "Frontend")));

// Swagger docs
try {
  const swaggerDocument = require("./swagger-output.json");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn("swagger-output.json not found yet - run `node swagger.js` to generate it.");
}

// Routes
app.use("/auth/customer", authCustRouter);
app.use("/auth/officer", authOfficerRouter);
app.use("/feedback", feedbackRouter);
app.use("/likes", likesRouter);
app.use("/catalog", catalogRouter);
app.use("/grade", gradeRouter);
app.use("/inspection", inspectionRouter);
app.use("/officer", officerRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/payment", paymentRouter);
app.use("/catalog/customer", catalogCustRouter);
app.use("/menu", menuRouter);
app.use("/profile/customer", profileCustRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/auth/owner", authOwnerRouter);
app.use("/feedback-replies", feedbackRepliesRouter);
app.use("/complaints", complaintStatusRouter);
app.use("/complaints", complaintsRouter);
app.use("/owner", ownerFeedbackRouter);

// Basic API test route
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Hawker Centre Management System API is running."
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
    method: req.method,
    path: req.originalUrl
  });
});

// General error handler
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    error: "Internal server error."
  });
});

// Start server
async function startServer() {
  try {
    await sql.connect(dbConfig);

    console.log("Database connection established successfully");

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await sql.close();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }

  process.exit(0);
});