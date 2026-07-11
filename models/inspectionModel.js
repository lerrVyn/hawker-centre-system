// Wei Ye
const { sql, poolPromise } = require("../dbConnection");
const { getGrade } = require("./utility");

async function retrieveAllInspection() {
    try {
        const connection = await poolPromise;
        const query = `select inspection_id, stall_id, officer_id, score, remarks, inspection_date from inspections`
        
        const result = await connection.request().query(query);
        
        return result.recordset;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function retrieveInspectionByID(id) {
    try {
        const connection = await poolPromise;
        const query = `select inspection_id, stall_id, officer_id, score, remarks, inspection_date from inspections where inspection_id = @id`
        
        const request = await connection.request()
        request.input("id", id);
        const result = await request.query(query);
        
        return result.recordset[0];
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function createInspection(inspectionInfo) {
    try {
        const connection = await poolPromise;
        let remarks = inspectionInfo.remarks;
        const query = `
            insert into inspections (stall_id, officer_id, score, remarks) values (@stall_id, @officer_id, @score, @remarks); 
            select scope_identity() as id;
            update stalls set hygiene_grade = @grade where stall_id = @stall_id;
        `;

        if (!inspectionInfo.remarks) { remarks = "None"}

        const request = await connection.request()
        request.input("stall_id", inspectionInfo.stall_id);
        request.input("officer_id", inspectionInfo.officer_id);
        request.input("score", inspectionInfo.score);
        request.input("remarks", remarks);
        request.input("grade", getGrade(inspectionInfo.score));
        const result = await request.query(query);
        const newInspectionID = result.recordset[0].id;


        return await retrieveInspectionByID(newInspectionID);
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function updateInspection(id,inspectionInfo) {
    try {
        const connection = await poolPromise;
        let remarks = inspectionInfo.remarks;
        const oldInspection = await retrieveInspectionByID(id);
        const query = `
            update inspections
            set
                stall_id = @stall_id,
                officer_id = @officer_id,
                score = @score,
                remarks = @remarks
            where inspection_id = @id;
        `;

        if (!remarks) { remarks = oldInspection.remarks; }

        const request = await connection.request()
        request.input("id", id);
        request.input("stall_id", inspectionInfo.stall_id);
        request.input("officer_id", inspectionInfo.officer_id);
        request.input("score", inspectionInfo.score);
        request.input("remarks", remarks);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null
        }
        return retrieveInspectionByID(id);
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function deleteInspection(id) {
    try {
        const connection = await poolPromise;
        const query = `delete from inspections where inspection_id = @id`

        const deletedInspection = await retrieveInspectionByID(id);

        const request = await connection.request();
        request.input("id", id);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null
        }
        return deletedInspection;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

module.exports = {
    retrieveAllInspection,
    retrieveInspectionByID,
    createInspection,
    updateInspection,
    deleteInspection
}