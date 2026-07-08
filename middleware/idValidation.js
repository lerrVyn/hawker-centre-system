// Wei Ye
function validateID(req, res, next) {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
        return res.status(400).json({error: "Invalid ID - Must be a positive integer"});
    }

    next();
}

module.exports = {
    validateID
}