// Wei Ye
const Joi = require("joi");

const officerSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name cannot be empty",
        "string.min": "Name must contain at least 1 character",
        "string.max": "Name cannot exceed 100 characters",
        "any.required": "Name is required"
    }),
    email: Joi.string().trim().min(1).max(255).required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email cannot be empty",
        "string.email": "Email must be a valid email address",
        "string.max": "Email cannot exceed 255 characters",
        "any.required": "Email is required"
    }),
    password: Joi.string().min(0).max(100).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 100 characters",
        "any.required": "Password is required"
    })
})

const updateOfficerSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name cannot be empty",
        "string.min": "Name must contain at least 1 character",
        "string.max": "Name cannot exceed 100 characters"
    }),
    email: Joi.string().trim().email().max(255).optional().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email cannot be empty",
        "string.email": "Email must be a valid email address",
        "string.max": "Email cannot exceed 255 characters"
    }),
    password: Joi.string().min(8).max(100).optional().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password cannot be empty",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 100 characters"
    })
}).min(1).messages({"object.min": "At least one field must be provided for update"});

function validateOfficer(req, res, next) {
    const { error } = officerSchema.validate(req.body, {abortEarly:false});

    if (error) {
        const errorMsg = error.details.map((details) => details.message).join(", ");
        return res.status(400).json({error: errorMsg});
    }
    next();
}

function validateOfficerUpdate(req, res, next) {
    const { error } = updateOfficerSchema.validate(req.body, {abortEarly:false});

    if (error) {
        const errorMsg = error.details.map((details) => details.message).join(", ");
        return res.status(400).json({error: errorMsg});
    }
    next();
}

module.exports = {
    validateOfficer,
    validateOfficerUpdate
}