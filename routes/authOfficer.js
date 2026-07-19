// Wei Ye
const express = require("express");
const { validateOfficerLogin } = require("../middleware/authOfficerValidation");
const router = express.Router();

const authOfficerController = require("../controller/authOfficerController")

router.post("/login", validateOfficerLogin, authOfficerController.login);

module.exports = router;