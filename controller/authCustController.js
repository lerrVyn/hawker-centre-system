//ziying
const bcrypt = require("bcrypt");
const Joi = require("joi");

const authCustModel = require("../models/authCustModel");
const jwt = require("jsonwebtoken");
// Test route
exports.test = (req, res) => {
    res.json({
        success: true,
        message: "Customer auth route is working!"
    });
};

// Validation rules
const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().allow("", null)
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

// Register customer
exports.register = async (req, res) => {

    try {

        // 1. Validate user input
        const { error, value } = registerSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { name, email, password, phone } = value;

        // 2. Check if email already exists
        const existingCustomer = await authCustModel.getCustomerByEmail(email);

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. Save customer
        const customer = await authCustModel.createCustomer(
            name,
            email,
            passwordHash,
            phone
        );

        // 5. Return success
        res.status(201).json({
            success: true,
            message: "Customer registered successfully!",
            data: customer
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

// Login customer
exports.login = async (req, res) => {
  try {
    // 1. Validate login details
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // 2. Find customer by email
    const customer = await authCustModel.getCustomerByEmail(email);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3. Compare entered password with stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      customer.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 4. Create login token
    const token = jwt.sign(
      {
        customerId: customer.customer_id,
        email: customer.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    // 5. Return successful login response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        customer_id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error("Customer login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in"
    });
  }
};