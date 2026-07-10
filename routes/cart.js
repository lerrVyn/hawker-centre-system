// Yuzhen 
const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");

// View customer's cart
router.get("/:customerId", cartController.getCart);

// Add item to cart
router.post("/", cartController.addToCart);

// Update quantity
router.put("/:cartItemId", cartController.updateQuantity);

// Remove cart item
router.delete("/:cartItemId", cartController.removeCartItem);

module.exports = router;