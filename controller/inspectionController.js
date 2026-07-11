// Wei Ye
const inspectionModel = require("../models/inspectionModel");
const gradeModel = require("../models/gradeModel");

async function retrieveAllInspection(req,res) {
    try {
        const inspectionsList = await inspectionModel.retrieveAllInspection();

        if (inspectionsList.length === 0) {
            return res.status(200).json({message: "There are currently no inspection logs"});
        }
        return res.status(200).json(inspectionsList);
    }
    catch (error) {
        console.error(`Inspection Controller error: ${error}`);
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
        console.error(`Inspection Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving inspection log`});
    }
}

async function createInspection(req,res) {
    try {
        const inspectionJSON = req.body;
        const newInspection = await inspectionModel.createInspection(inspectionJSON);
        await gradeModel.createGrade(newInspection);

        return res.status(201).json(newInspection);
    }
    catch (error) {
        console.error(`Inspection Controller error: ${error}`);
        return res.status(500).json({error: `Error creating inspection log`});
    }
}

async function updateInspection(req,res) {
    try {
        const id = parseInt(req.params.id);
        const inspectionJSON = req.body;
        const updatedInspection = await inspectionModel.updateInspection(id, inspectionJSON);

        if (!updatedInspection) {
            return res.status(404).json({message: "Inspection log not found"});
        }
        
        await gradeModel.updateGrade(updatedInspection);

        return res.status(200).json(updatedInspection);
    }
    catch (error) {
        console.error(`Inspection Controller error: ${error}`);
        return res.status(500).json({error: `Error updating inspection log`});
    }
}

async function deleteInspection(req,res) {
    try {
        const id = parseInt(req.params.id);
        const inspection = await inspectionModel.retrieveInspectionByID(id);
        
        if (!inspection) {
            return res.status(404).json({message: "Inspection log not found"});
        }

        await gradeModel.deleteGrade(inspection);
        const deletedInspection = await inspectionModel.deleteInspection(id);

        return res.status(200).json(deletedInspection);
    }
    catch (error) {
        console.error(`Inspection Controller error: ${error}`);
        return res.status(500).json({error: `Error deleting inspection log`});
    }
}

module.exports = {
    retrieveAllInspection,
    retrieveInspectionByID,
    createInspection,
    updateInspection,
    deleteInspection
}