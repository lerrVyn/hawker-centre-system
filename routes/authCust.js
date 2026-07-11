//ziying
const express = require("express");
const router = express.Router();

const authCustController = require("../controller/authCustController");

// Test
router.get("/test", authCustController.test);

// Register
router.post("/register", authCustController.register);

// Login
router.post("/login", authCustController.login);

module.exports = router;