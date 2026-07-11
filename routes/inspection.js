// Wei Ye
const express = require("express");
const { validateID } = require("../middleware/idValidation");
const { validateInspection } = require("../middleware/inspectionValidation");
const router = express.Router();

const inspectionController = require("../controller/inspectionController");

// Routes
router.get("/", inspectionController.retrieveAllInspection);
router.get("/:id", validateID, inspectionController.retrieveInspectionByID);
router.post("/", validateInspection, inspectionController.createInspection);
router.put("/:id", validateID, validateInspection, inspectionController.updateInspection);
router.delete("/:id", validateID, inspectionController.deleteInspection);

module.exports = router;