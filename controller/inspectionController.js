// Wei Ye
const inspectionModel = require("../models/inspectionModel");

async function retrieveAllInspection(req,res) {
    try {
        const inspectionsList = await inspectionModel.retrieveAllInspection();

        if (inspectionsList.length === 0) {
            return res.json({message: "There are currently no inspection logs"});
        }

        res.json(inspectionsList);
    }
    catch (error) {
        console.error(`Controller error: ${error}`);
        res.status(500).json({error: `Error retrieving inspection logs`});
    }
}

async function retrieveInspectionByID(req,res) {
    try {
        const id = parseInt(req.params.id);
        const inspection = await inspectionModel.retrieveInspectionByID(id);

        if (!inspection) {
            return res.json({message: "Inspection log not found"});
        }

        res.json(inspection);
    }
    catch (error) {
        console.error(`Controller error: ${error}`);
        res.status(500).json({error: `Error retrieving inspection log`});
    }
}

module.exports = {
    retrieveAllInspection,
    retrieveInspectionByID
}