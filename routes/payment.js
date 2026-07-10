// Yuzhen 
const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

// Make Payment
router.post("/", paymentController.makePayment);

// Get Payment Details
router.get("/:orderId", paymentController.getPayment);

// Update Payment Status
router.put("/:paymentId", paymentController.updatePaymentStatus);

module.exports = router;