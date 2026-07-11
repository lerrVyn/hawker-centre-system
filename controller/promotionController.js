const promotionModel = require("../models/promotionModel");

// GET ALL PROMOTIONS
async function getAllPromotions(req, res) {
    try {
        const promotions = await promotionModel.getAllPromotions();
        res.json(promotions);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Unable to retrieve promotions."
        });
    }
}

// GET PROMOTION BY ID
async function getPromotionById(req, res) {
    try {
        const id = req.params.id;

        const promotion = await promotionModel.getPromotionById(id);

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion not found."
            });
        }

        res.json(promotion);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Unable to retrieve promotion."
        });
    }
}

// CREATE PROMOTION
async function createPromotion(req, res) {

    try {

        const {
            stall_id,
            promo_name,
            discount_percent,
            start_date,
            end_date,
            description
        } = req.body;

        if (
            !stall_id ||
            !promo_name ||
            !discount_percent ||
            !start_date ||
            !end_date
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        if (discount_percent < 0 || discount_percent > 100) {
            return res.status(400).json({
                message: "Discount must be between 0 and 100."
            });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({
                message: "End date cannot be before start date."
            });
        }

        await promotionModel.createPromotion(req.body);

        res.status(201).json({
            message: "Promotion created successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Unable to create promotion."
        });

    }

}

// UPDATE PROMOTION
async function updatePromotion(req, res) {

    try {

        const id = req.params.id;

        const {
            start_date,
            end_date,
            discount_percent
        } = req.body;

        if (discount_percent < 0 || discount_percent > 100) {
            return res.status(400).json({
                message: "Discount must be between 0 and 100."
            });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({
                message: "End date cannot be before start date."
            });
        }

        await promotionModel.updatePromotion(id, req.body);

        res.json({
            message: "Promotion updated successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Unable to update promotion."
        });

    }

}

// DELETE PROMOTION
async function deletePromotion(req, res) {

    try {

        const id = req.params.id;

        await promotionModel.deletePromotion(id);

        res.json({
            message: "Promotion deleted successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Unable to delete promotion."
        });

    }

}

module.exports = {
    getAllPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion
};