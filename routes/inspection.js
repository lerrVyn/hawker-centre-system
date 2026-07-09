// Wei Ye
const express = require("express");
const { validateID } = require("../middleware/idValidation");
const router = express.Router();

const inspectionController = require("../controller/inspectionController");

// Routes
router.get("/", inspectionController.retrieveAllInspection);
router.get("/:id", validateID, inspectionController.retrieveInspectionByID);

module.exports = router