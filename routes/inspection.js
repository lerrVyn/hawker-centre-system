// Wei Ye
const express = require("express");
const { validateID } = require("../middleware/idValidation");
const router = express.Router();

const inspectionController = require("../controller/inspectionController");

// Routes
router.get("/", inspectionController.retrieveAllInspection);

// Retrieves specific inspection
router.get("/:id", async (req,res) => {
    const id = parseInt(req.params.id);

});

module.exports = router