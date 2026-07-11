// Ziying
const catalogCustModel = require("../models/catalogCustModel");

// Browse all stalls
exports.getAllStalls = async (req, res) => {
  try {
    const stalls = await catalogCustModel.getAllStalls();

    return res.status(200).json({
      success: true,
      message: "Stalls retrieved successfully",
      data: stalls
    });
  } catch (error) {
    console.error("Browse stalls error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve stalls"
    });
  }
};

// Browse menu items from a selected stall
exports.getMenuItemsByStallId = async (req, res) => {
  try {
    const stallId = Number(req.params.stallId);

    if (!Number.isInteger(stallId) || stallId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stall ID"
      });
    }

    const menuItems =
      await catalogCustModel.getMenuItemsByStallId(stallId);

    return res.status(200).json({
      success: true,
      message: "Menu items retrieved successfully",
      data: menuItems
    });
  } catch (error) {
    console.error("Browse menu items error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve menu items"
    });
  }
};