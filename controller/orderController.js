const Joi = require("joi");
const orderModel = require("../models/orderModel");

const checkoutSchema = Joi.object({
  customerId: Joi.number().integer().positive().required()
});

exports.checkout = async (req, res) => {
  const { error, value } = checkoutSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }

  try {
    const result = await orderModel.checkout(value.customerId);

    return res.status(201).json({
      message: "Order created successfully.",
      orderId: result.orderId,
      totalPrice: result.totalPrice
    });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);

    return res.status(500).json({
      error: "Checkout failed.",
      details: err.message
    });
  }
};

// ==========================
// Order History
// ==========================
exports.getOrderHistory = async (req, res) => {

  const customerId = parseInt(req.params.customerId);

  if (isNaN(customerId)) {
    return res.status(400).json({
      error: "Invalid customer ID."
    });
  }

  try {

    const orders = await orderModel.getOrderHistory(customerId);

    res.json(orders);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Unable to retrieve order history."
    });

  }

};

// ==========================
// Order Status
// ==========================
exports.getOrderStatus = async (req, res) => {

  const orderId = parseInt(req.params.orderId);

  if (isNaN(orderId)) {
    return res.status(400).json({
      error: "Invalid order ID."
    });
  }

  try {

    const order = await orderModel.getOrderStatus(orderId);

    if (!order) {
      return res.status(404).json({
        error: "Order not found."
      });
    }

    res.json(order);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Unable to retrieve order status."
    });

  }

};