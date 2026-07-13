const Joi = require("joi");
const paymentModel = require("../models/paymentModel");

const paymentSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  paymentMethod: Joi.string()
    .valid("Cash", "NETS", "PayNow")
    .required()
});

const updatePaymentSchema = Joi.object({
  paymentStatus: Joi.string()
    .valid("Pending", "Paid", "Failed", "Refunded")
    .required()
});

exports.makePayment = async (req, res) => {
  const { error, value } = paymentSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }

  try {
    const result = await paymentModel.makePayment(
      value.orderId,
      value.paymentMethod
    );

    return res.status(201).json({
      message: "Payment completed successfully.",
      paymentId: result.paymentId
    });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);

    return res.status(500).json({
      error: "Payment failed.",
      details: err.message
    });
  }
};

exports.getPayment = async (req, res) => {
  const orderId = Number(req.params.orderId);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      error: "Invalid order ID."
    });
  }

  try {
    const payment = await paymentModel.getPayment(orderId);

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found."
      });
    }

    return res.status(200).json(payment);
  } catch (err) {
    console.error("GET PAYMENT ERROR:", err);

    return res.status(500).json({
      error: "Unable to retrieve payment.",
      details: err.message
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  const { error, value } = updatePaymentSchema.validate(req.body);

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return res.status(400).json({
      error: "Invalid payment ID."
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }

  try {
    const updated = await paymentModel.updatePaymentStatus(
      paymentId,
      value.paymentStatus
    );

    if (!updated) {
      return res.status(404).json({
        error: "Payment not found."
      });
    }

    return res.status(200).json({
      message: "Payment status updated successfully."
    });
  } catch (err) {
    console.error("UPDATE PAYMENT ERROR:", err);

    return res.status(500).json({
      error: "Unable to update payment status.",
      details: err.message
    });
  }
};