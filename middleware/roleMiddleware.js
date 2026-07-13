// Ge Siyu

function authorizeRoles(...roles) {

    return (req, res, next) => {

        // Check if user exists
        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Please login first."
            });

        }

        // Check if user has the correct role
        if (!roles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message: "Access denied."
            });

        }

        next();

    };

}

module.exports = authorizeRoles;