//siyu
const express = require("express");

const router = express.Router();

const profileController = require("../controller/profileController");

// View profile
router.get(
    "/",
    profileController.getProfile
);

// Update profile
router.put(
    "/",
    profileController.updateProfile
);

module.exports = router;