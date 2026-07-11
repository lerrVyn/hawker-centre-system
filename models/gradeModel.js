// Wei Ye
const { sql, poolPromise } = require("../dbConnection");
const { retrieveInspectionByID } = require("./inspectionModel");
const { getGrade } = require("./utility");

async function retrieveAllGrades() {
    try {
        const connection = await poolPromise;
        const query = `select grade_id, inspection_id, grade, issued_date, valid_until from hygiene_grades`
        
        const result = await connection.request().query(query); 

        return result.recordset;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function retrieveGradeByID(id) {
    try {
        const connection = await poolPromise;
        const query = `select grade_id, inspection_id, grade, issued_date, valid_until from hygiene_grades where grade_id = @id`
        
        const request = await connection.request();
        request.input("id", id);
        const result = await request.query(query)

        return result.recordset;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function createGrade(inspection) {
    try {
        const connection = await poolPromise;
        // const inspectionInfo = await retrieveInspectionByID(inspectionID);
        const inspectionID = inspection.inspection_id;
        const grade = getGrade(inspection.score);
        const valid_until = new Date();
        valid_until.setMonth(valid_until.getMonth() + 6);
        const query = `insert into hygiene_grades (inspection_id, grade, valid_until) values (@inspection_id, @grade, @valid_until); select scope_identity() as id;`

        const request = connection.request()
        request.input("inspection_id", inspectionID);
        request.input("grade", grade);
        request.input("valid_until", valid_until)
        const result = await request.query(query);
        const newGradeID = result.recordset[0].id;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function updateGrade(inspection) {
    try {
        const connection = await poolPromise;
        const id = inspection.inspection_id;
        const grade = getGrade(inspection.score);
        const query = `
            update hygiene_grades
            set grade = @grade
            where inspection_id = @id;
        `;

        const request = await connection.request()
        request.input("id", id);
        request.input("grade", grade);
        const result = await request.query(query);
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function deleteGrade(inspection) {
        try {
        const connection = await poolPromise;
        const id = inspection.inspection_id;
        const query = `delete from hygiene_grades where inspection_id = @id`

        const request = await connection.request();
        request.input("id", id);
        const result = await request.query(query);
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

module.exports = {
    retrieveAllGrades,
    retrieveGradeByID,
    createGrade,
    updateGrade,
    deleteGrade
}