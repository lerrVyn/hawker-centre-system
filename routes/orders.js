// Yuzhen
const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");

// Checkout (Create Order)
router.post("/checkout", orderController.checkout);

// Get all orders for a customer
router.get("/history/:customerId", orderController.getOrderHistory);

// Get a specific order's status
router.get("/:orderId/status", orderController.getOrderStatus);

module.exports = router;