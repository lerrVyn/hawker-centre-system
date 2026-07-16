// Ge Siyu

const express = require("express");
const router = express.Router();

const menuController = require("../controller/menuController");

// Test route
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Menu router works!"
    });
});

// Get all menu items for a stall
router.get(
    "/stall/:stallId",
    menuController.getMenuItems
);

// Get one menu item
router.get(
    "/:itemId",
    menuController.getMenuItem
);

// Add new menu item
router.post(
    "/",
    menuController.createMenuItem
);

// Update menu item
router.put(
    "/:itemId",
    menuController.updateMenuItem
);

// Delete menu item
router.delete(
    "/:itemId",
    menuController.deleteMenuItem
);

module.exports = router;