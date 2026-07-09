// Wei Ye
const inspectionModel = require("../models/inspectionModel");

async function retrieveAllInspection(req,res) {
    try {
        const inspectionsList = await inspectionModel.retrieveAllInspection();

        if (inspectionsList.length === 0) {
            return res.status(200).json({message: "There are currently no inspection logs"});
        }

        return res.status(200).json(inspectionsList);
    }
    catch (error) {
        console.error(`Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving inspection logs`});
    }
}

async function retrieveInspectionByID(req,res) {
    try {
        const id = parseInt(req.params.id);
        const inspection = await inspectionModel.retrieveInspectionByID(id);

        if (!inspection) {
            return res.status(404).json({message: "Inspection log not found"});
        }

        return res.status(200).json(inspection);
    }
    catch (error) {
        console.error(`Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving inspection log`});
    }
}

async function createInspection(req,res) {
    try {
        const inspectionJSON = req.body;
        const newInspection = await inspectionModel.createInspection(inspectionJSON);

        return res.status(201).json(newInspection);
    }
    catch (error) {
        console.error(`Controller error: ${error}`);
        return res.status(500).json({error: `Error creating inspection log`});
    }
}

module.exports = {
    retrieveAllInspection,
    retrieveInspectionByID,
    createInspection    
}