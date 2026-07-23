//ziying
const Joi = require("joi");
const profileCustModel = require("../models/profileCustModel");
const bcrypt = require("bcryptjs");
const passwordCustModel = require("../models/passwordCustModel");

// Validation rules for editing profile
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  email: Joi.string()
    .trim()
    .email()
    .max(255)
    .required(),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must contain exactly 8 digits"
    })
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required(),

    newPassword: Joi.string()
        .min(6)
        .required(),

    confirmPassword: Joi.string()
        .valid(Joi.ref("newPassword"))
        .required()
        .messages({
            "any.only": "Confirm password must match the new password"
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

    const customerWithEmail =
      await profileCustModel.getCustomerByEmail(value.email);

    if (
      customerWithEmail &&
      customerWithEmail.customer_id !== customerId
    ) {
      return res.status(409).json({
        error: "Email address is already in use"
      });
    }

    const updatedCustomer =
      await profileCustModel.updateCustomerProfile(
        customerId,
        value.name,
        value.email,
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

async function changeCustomerPassword(req, res) {
    try {
        const customerId = req.user.customer_id;

        // 1. Validate request body
        const { error, value } = changePasswordSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const {
            currentPassword,
            newPassword
        } = value;

        // 2. Get current password hash from database
        const customer =
            await passwordCustModel.getCustomerPassword(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer account not found"
            });
        }

        // 3. Check whether current password is correct
        const passwordMatches = await bcrypt.compare(
            currentPassword,
            customer.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // 4. Prevent customer from reusing the same password
        const samePassword = await bcrypt.compare(
            newPassword,
            customer.password_hash
        );

        if (samePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from the current password"
            });
        }

        // 5. Hash the new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 6. Update database
        await passwordCustModel.updateCustomerPassword(
            customerId,
            newPasswordHash
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to change password"
        });
    }
};

module.exports = {
  getProfile,
  updateProfile,
  changeCustomerPassword
};