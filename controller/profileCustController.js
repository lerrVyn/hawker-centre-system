const Joi = require("joi");
const profileCustModel = require("../models/profileCustModel");

// Validation rules for editing profile
const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must contain exactly 8 digits"
    })
});

// GET /profile/customer
async function getProfile(req, res) {
  try {
    const customerId = req.user.customer_id;

    const customer = await profileCustModel.getCustomerProfile(customerId);

    if (!customer) {
      return res.status(404).json({
        error: "Customer profile not found"
      });
    }

    return res.status(200).json({
      message: "Customer profile retrieved successfully",
      customer
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      error: "Unable to retrieve customer profile"
    });
  }
}

// PUT /profile/customer
async function updateProfile(req, res) {
  try {
    const customerId = req.user.customer_id;

    const { error, value } = updateProfileSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map(detail => detail.message)
      });
    }

    const existingCustomer =
      await profileCustModel.getCustomerProfile(customerId);

    if (!existingCustomer) {
      return res.status(404).json({
        error: "Customer profile not found"
      });
    }

    const updatedCustomer =
      await profileCustModel.updateCustomerProfile(
        customerId,
        value.name,
        value.phone
      );

    return res.status(200).json({
      message: "Customer profile updated successfully",
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      error: "Unable to update customer profile"
    });
  }
}

module.exports = {
  getProfile,
  updateProfile
};