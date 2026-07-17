// Wei Ye
const express = require("express");
const { validateID } = require("../middleware/idValidation");
const { validateOfficer } = require("../middleware/officerValidation");
const router = express.Router();

const officerController = require("../controller/neaOfficerController")

// Routes
router.get("/", officerController.retrieveAllOfficer);
router.get("/:id", validateID, officerController.retrieveOfficerById);
router.post("/", validateOfficer, officerController.createOfficer);
router.put("/:id", validateID, validateOfficer, officerController.updateOfficer);
router.delete("/:id", validateID, officerController.deleteOfficer);

module.exports = router;