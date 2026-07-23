// Ge Siyu

const dashboardModel = require("../models/dashboardModel");

// ==========================
// Sales Dashboard Summary
// ==========================
exports.getSalesSummary = async (req, res) => {

    try {

        const stallId = parseInt(req.params.stallId);

        if (isNaN(stallId) || stallId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid stall ID."
            });

        }

        const summary = await dashboardModel.getSalesSummary(stallId);

        return res.status(200).json({
            success: true,
            message: "Sales summary retrieved successfully.",
            data: summary
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve sales summary."
        });

    }

};

// ==========================
// Top Selling Items
// ==========================
exports.getTopSellingItems = async (req, res) => {

    try {

        const stallId = parseInt(req.params.stallId);

        if (isNaN(stallId) || stallId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid stall ID."
            });

        }

        const items = await dashboardModel.getTopSellingItems(stallId);

        return res.status(200).json({
            success: true,
            message: "Top selling items retrieved successfully.",
            data: items
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve top selling items."
        });

    }

};

// ==========================
// Daily Sales
// ==========================
exports.getDailySales = async (req, res) => {

    try {

        const stallId = parseInt(req.params.stallId);

        if (isNaN(stallId) || stallId <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid stall ID."
            });

        }

        const sales = await dashboardModel.getDailySales(stallId);

        return res.status(200).json({
            success: true,
            message: "Daily sales retrieved successfully.",
            data: sales
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve daily sales."
        });

    }

};