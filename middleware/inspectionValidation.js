// Wei Ye
const Joi = require("joi");

const inspectionSchema = Joi.object({
    stall_id: Joi.number().integer().min(1).required().messages({
        "number.base": "Stall ID must be a number",
        "number.integer": "Stall ID must be an integer",
        "number.min": "Stall ID must be at least 1",
        "any.required": "Stall ID is required"
    }),
    officer_id: Joi.number().integer().min(1).required().messages({
        "number.base": "Officer ID must be a number",
        "number.integer": "Officer ID must be an integer",
        "number.min": "Officer ID must be at least 1",
        "any.required": "Officer ID is required"
    }),
    score: Joi.number().integer().min(0).max(100).required().messages({
        "number.base": "Score must be a number",
        "number.integer": "Score must be an integer",
        "number.min": "Score cannot be less than 0",
        "number.max": "Score cannot exceed 100",
        "any.required": "Score is required"
    }),
    remarks: Joi.string().max(500).allow("").optional().messages({
        "string.base": "Remarks must be a string",
        "string.max": "Remarks cannot exceed 500 characters"
    })
})

function validateInspection(req, res, next) {
    const { error } = inspectionSchema.validate(req.body, {abortEarly:false});

    if (error) {
        const errorMsg = error.details.map((details) => details.message).join(", ");
        return res.status(400).json({error: errorMsg});
    }
    next();
}

module.exports = {
    validateInspection
}