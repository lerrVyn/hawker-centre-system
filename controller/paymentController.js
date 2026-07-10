const Joi = require("joi");
const paymentModel = require("../models/paymentModel");

const paymentSchema = Joi.object({
    orderId: Joi.number().integer().required(),
    paymentMethod: Joi.string().max(50).required()
});

const updateSchema = Joi.object({
    paymentStatus: Joi.string().max(50).required()
});

// ==========================
// Make Payment
// ==========================

exports.makePayment = async (req, res) => {

    const { error, value } = paymentSchema.validate(req.body);

    if (error)
        return res.status(400).json({
            error: error.details[0].message
        });

    try {

        const payment = await paymentModel.makePayment(value);

        res.status(201).json({

            message: "Payment successful.",
            paymentId: payment.paymentId

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Payment failed."

        });

    }

};

// ==========================
// Get Payment
// ==========================

exports.getPayment = async (req, res) => {

    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId))
        return res.status(400).json({
            error: "Invalid order ID."
        });

    try {

        const payment = await paymentModel.getPayment(orderId);

        if (!payment)
            return res.status(404).json({
                error: "Payment not found."
            });

        res.json(payment);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Unable to retrieve payment."
        });

    }

};

// ==========================
// Update Payment Status
// ==========================

exports.updatePaymentStatus = async (req, res) => {

    const paymentId = parseInt(req.params.paymentId);

    const { error, value } = updateSchema.validate(req.body);

    if (error)
        return res.status(400).json({
            error: error.details[0].message
        });

    try {

        await paymentModel.updatePaymentStatus(paymentId, value.paymentStatus);

        res.json({

            message: "Payment status updated."

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error: "Unable to update payment."

        });

    }

};