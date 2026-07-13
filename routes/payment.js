// Yuzhen 
const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

router.post("/", paymentController.makePayment);
router.get("/:orderId", paymentController.getPayment);
router.put("/:paymentId", paymentController.updatePaymentStatus);

module.exports = router;