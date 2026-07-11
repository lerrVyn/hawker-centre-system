// Wei Ye
const express = require("express");
const { validateID } = require("../middleware/idValidation");
const { validateInspection } = require("../middleware/inspectionValidation");
const router = express.Router();

const gradeController = require("../controller/gradeController");

router.get("/", gradeController.retrieveAllGrades);
router.get("/:id", validateID, gradeController.retrieveGradeByID);

module.exports = router;