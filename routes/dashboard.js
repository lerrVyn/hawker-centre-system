// Ge Siyu

const express = require("express");
const router = express.Router();

const dashboardController = require("../controller/dashboardController");

// ==========================
// Sales Summary
// ==========================
router.get(
    "/sales/:stallId",
    dashboardController.getSalesSummary
);

// ==========================
// Top Selling Items
// ==========================
router.get(
    "/top-items/:stallId",
    dashboardController.getTopSellingItems
);

// ==========================
// Daily Sales
// ==========================
router.get(
    "/daily-sales/:stallId",
    dashboardController.getDailySales
);

module.exports = router;