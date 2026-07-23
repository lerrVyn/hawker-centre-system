const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const profileCustController = require("../controller/profileCustController");

// View logged-in customer's profile
router.get(
  "/",
  verifyToken,
  profileCustController.getProfile
);

// Update logged-in customer's profile
router.put(
  "/",
  verifyToken,
  profileCustController.updateProfile
);

router.put(
  "/customer/password",
  verifyToken,
  profileCustController.changeCustomerPassword
);

module.exports = router;