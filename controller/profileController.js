const profileModel = require("../models/profileModel");

// GET Stall Profile
async function getProfile(req, res) {

    try {

        // Temporary for development
        const ownerId = 1;

        const profile = await profileModel.getProfile(ownerId);

        if (!profile) {
            return res.status(404).json({
                message: "Stall profile not found."
            });
        }

        res.json(profile);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Unable to retrieve stall profile."
        });

    }

}

// UPDATE Stall Profile
async function updateProfile(req, res) {

    try {

        const ownerId = 1;

        const {
            stall_name,
            description,
            cuisine_type,
            operating_hours
        } = req.body;

        if (
            !stall_name ||
            !description ||
            !cuisine_type ||
            !operating_hours
        ) {
            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        await profileModel.updateProfile(ownerId, req.body);

        res.json({
            message: "Stall profile updated successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Unable to update stall profile."
        });

    }

}

module.exports = {
    getProfile,
    updateProfile
};