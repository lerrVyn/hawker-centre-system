// Wei Ye
const officerModel = require("../models/neaOfficerModel");

async function retrieveAllOfficer(req, res) {
    try {
        const officerList = await officerModel.retrieveAllOfficer();

        if (officerList.length === 0) {
            return res.status(200).json({message: "There are currently no registered NEA Officers"});
        }
        return res.status(200).json(officerList);
    }
    catch (error) {
        console.error(`NEA Officer Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving officers`});
    }
}

async function retrieveOfficerById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const officer = await officerModel.retrieveOfficerById(id);

        if (!officer) {
            return res.status(404).json({message: "NEA Officer not found."});
        }
        return res.status(200).json(officer);
    }
    catch (error) {
        console.error(`NEA Officer Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving officer`});
    }
}

async function createOfficer(req, res) {
    try {
        const officerJSON = req.body;
        const newOfficer = await officerModel.createOfficer(officerJSON);

        return res.status(201).json(newOfficer);
    }
    catch (error) {
        console.error(`NEA Officer Controller error: ${error}`);
        return res.status(500).json({error: `Error creating officer`});
    }
}

async function updateOfficer(req, res) {
    try {
        const id = parseInt(req.params.id);
        const officerJSON = req.body;
        const updatedOfficer = await officerModel.updateOfficer(id, officerJSON);
        
        if (!updatedOfficer) {
            return res.status(404).json({message: "NEA Officer not found."});
        }
        return res.status(200).json(updatedOfficer);
    }
    catch (error) {
        console.error(`NEA Officer Controller error: ${error}`);
        return res.status(500).json({error: `Error updating officer`});
    }
}

async function deleteOfficer(req, res) {
        try {
        const id = parseInt(req.params.id);
        const officer = await officerModel.retrieveOfficerById(id);

        if (!officer) {
            return res.status(404).json({message: "NEA Officer not found."});
        }

        const deletedOfficer = await officerModel.deleteOfficer(id);
        return res.status(200).json(deletedOfficer);
    }
    catch (error) {
        console.error(`NEA Officer Controller error: ${error}`);
        return res.status(500).json({error: `Error deleting officer`});
    }
}

module.exports = {
    retrieveAllOfficer,
    retrieveOfficerById,
    createOfficer,
    updateOfficer,
    deleteOfficer
}