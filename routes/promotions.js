// Siyu

const express = require("express");
const router = express.Router();

const promotionController = require("../controller/promotionController");

// Get all promotions
router.get(
    "/promotions",
    promotionController.getAllPromotions
);

// Get one promotion
router.get(
    "/promotions/:id",
    promotionController.getPromotionById
);

// Create promotion
router.post(
    "/promotions",
    promotionController.createPromotion
);

// Update promotion
router.put(
    "/promotions/:id",
    promotionController.updatePromotion
);

// Delete promotion
router.delete(
    "/promotions/:id",
    promotionController.deletePromotion
);

module.exports = router;