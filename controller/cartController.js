const Joi = require("joi");
const cartModel = require("../models/cartModel");

const addSchema = Joi.object({
    customerId: Joi.number().integer().required(),
    itemId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required()
});

const updateSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required()
});

// =========================
// GET CART
// =========================

exports.getCart = async (req, res) => {

    try {

        const customerId = parseInt(req.params.customerId);

        const cart = await cartModel.getCart(customerId);

        res.json(cart);

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Unable to retrieve cart." });

    }

};

// =========================
// ADD ITEM
// =========================

exports.addToCart = async (req, res) => {

    const { error, value } = addSchema.validate(req.body);

    if (error)
        return res.status(400).json({ error: error.details[0].message });

    try {

        await cartModel.addItem(value);

        res.status(201).json({
            message: "Item added to cart."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Unable to add item."
        });

    }

};

// =========================
// UPDATE QUANTITY
// =========================

exports.updateQuantity = async (req, res) => {

    const { error, value } = updateSchema.validate(req.body);

    if (error)
        return res.status(400).json({ error: error.details[0].message });

    try {

        await cartModel.updateQuantity(
            parseInt(req.params.cartItemId),
            value.quantity
        );

        res.json({
            message: "Cart updated successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Unable to update quantity."
        });

    }

};

// =========================
// REMOVE ITEM
// =========================

exports.removeCartItem = async (req, res) => {

    try {

        await cartModel.removeItem(
            parseInt(req.params.cartItemId)
        );

        res.json({
            message: "Item removed successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Unable to remove item."
        });

    }

};