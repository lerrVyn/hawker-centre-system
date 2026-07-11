// Ziying
const express = require("express");
const router = express.Router();

const catalogCustController =
  require("../controller/catalogCustController");

// Browse all stalls
router.get("/stalls", catalogCustController.getAllStalls);

// Browse menu items from one stall
router.get(
  "/stalls/:stallId/menu",
  catalogCustController.getMenuItemsByStallId
);

module.exports = router;