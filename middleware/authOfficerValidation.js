// Wei Ye
const Joi = require("joi");

const loginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email cannot be empty",
        "string.email": "Email must be a valid email address",
        "any.required": "Email is required"
    }),
    password: Joi.string().trim().min(1).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password cannot be empty",
        "string.min": "Password cannot be empty",
        "any.required": "Password is required"
    })
});

function validateOfficerLogin(req, res, next) {
    const { error } = loginSchema.validate(req.body, {abortEarly: false});

    if (error) {
        const errorMsg = error.details.map((details) => details.message).join(", ");
        return res.status(400).json({error: errorMsg});
    }
    next();
}

module.exports = {
    validateOfficerLogin
};