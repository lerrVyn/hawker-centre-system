// Wei Ye
const gradeModel = require("../models/gradeModel");

async function retrieveAllGrades(req,res) {
    try {
        const gradesList = await gradeModel.retrieveAllGrades();

        if (gradesList.length === 0) {
            return res.status(200).json({message: "There are currently no grade logs"});
        }
        return res.status(200).json(gradesList);
    }
    catch (error) {
        console.error(`Grade Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving grade logs`});
    }
}

async function retrieveGradeByID(req,res) {
    try {
        const id = parseInt(req.params.id);
        const gradeList = await gradeModel.retrieveGradeByID(id);

        if (gradeList.length === 0) {
            return res.status(404).json({message: "Grade logs not found"});
        }
        return res.status(200).json(gradeList);
    }
    catch (error) {
        console.error(`Grade Controller error: ${error}`);
        return res.status(500).json({error: `Error retrieving grade log`});
    }
}

module.exports = {
    retrieveAllGrades,
    retrieveGradeByID
}