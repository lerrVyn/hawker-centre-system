// Ge Siyu

const menuModel = require("../models/menuModel");

// ==========================
// Get all menu items by stall
// ==========================
exports.getMenuItems = async (req, res) => {
    try {

        console.log("getMenuItems called");

        const stallId = parseInt(req.params.stallId);

        if (isNaN(stallId) || stallId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid stall ID."
            });
        }

        const menuItems = await menuModel.getMenuItems(stallId);

        return res.status(200).json({
            success: true,
            message: "Menu items retrieved successfully.",
            data: menuItems
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve menu items."
        });

    }
};

// ==========================
// Get one menu item
// ==========================
exports.getMenuItem = async (req, res) => {

    try {

        const itemId = parseInt(req.params.itemId);

        if (isNaN(itemId) || itemId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID."
            });

        }

        const item = await menuModel.getMenuItem(itemId);

        if (!item) {

            return res.status(404).json({
                success: false,
                message: "Menu item not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Menu item retrieved successfully.",
            data: item
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve menu item."
        });

    }

};

// ==========================
// Create menu item
// ==========================
exports.createMenuItem = async (req, res) => {

    try {

        const {
            stall_id,
            item_name,
            description,
            price,
            is_available,
            image_url
        } = req.body;

        if (!stall_id || !item_name || price == null) {

            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });

        }

        if (price <= 0) {

            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0."
            });

        }

        await menuModel.createMenuItem({
            stall_id,
            item_name,
            description,
            price,
            is_available,
            image_url
        });

        return res.status(201).json({
            success: true,
            message: "Menu item created successfully."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to create menu item."
        });

    }

};

// ==========================
// Update menu item
// ==========================
exports.updateMenuItem = async (req, res) => {

    try {

        const itemId = parseInt(req.params.itemId);

        if (isNaN(itemId) || itemId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID."
            });

        }

        if (req.body.price !== undefined && req.body.price <= 0) {

            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0."
            });

        }

        await menuModel.updateMenuItem(itemId, req.body);

        return res.status(200).json({
            success: true,
            message: "Menu item updated successfully."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to update menu item."
        });

    }

};

// ==========================
// Delete menu item
// ==========================
exports.deleteMenuItem = async (req, res) => {

    try {

        const itemId = parseInt(req.params.itemId);

        if (isNaN(itemId) || itemId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID."
            });

        }

        await menuModel.deleteMenuItem(itemId);

        return res.status(200).json({
            success: true,
            message: "Menu item deleted successfully."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete menu item."
        });

    }

};