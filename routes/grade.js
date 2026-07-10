// Wei Ye
const express = require("express");
const { validateID } = require("../middleware/idValidation");
const { validateInspection } = require("../middleware/inspectionValidation");
const router = express.Router();