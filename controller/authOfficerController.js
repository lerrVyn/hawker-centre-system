// Wei Ye
const authOfficerModel = require("../models/authOfficerModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const officer = await authOfficerModel.retrieveOfficerByEmail(email);

        if (!officer) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        const match = await bcrypt.compare(password, officer.password_hash);
        if (!match) {
            return res.status(401).json({
                success: false, 
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign(
            {
                officer_id: officer.officer_id,
                email: officer.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                officer_id: officer.officer_id,
                name: officer.name,
                email: officer.email
            }
        });
    }
    catch (error) {
        console.error(`Officer Authentication Controller error: ${error}`);
        return res.status(500).json({
            success: false,
            message: `Error logging in`
        });
    }
}

module.exports = {
    login
}