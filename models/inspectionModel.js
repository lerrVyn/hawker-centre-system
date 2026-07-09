// Wei Ye
const { sql, poolPromise } = require("../dbConnection");

async function retrieveAllInspection() {
    try {
        const connection = await poolPromise;
        const query = "select inspection_id, stall_id, officer_id, score, remarks, inspection_date from inspections"
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
        const query = "select inspection_id, stall_id, officer_id, score, remarks, inspection_date from inspections where inspection_id = @id"
        
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
        const query = "insert into inspections (stall_id, officer_id, score, remarks) values (@stall_id, @officer_id, @score, @remarks); select scope_identity() as id;";

        const request = await connection.request()
        request.input("stall_id", inspectionInfo.stall_id);
        request.input("officer_id", inspectionInfo.officer_id);
        request.input("score", inspectionInfo.score);
        request.input("remarks", inspectionInfo.remarks);
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
        const query = `
            update inspections
            set
                stall_id = @stall_id,
                officer_id = @officer_id,
                score = @score,
                remarks = @remarks
            where inspection_id = @id;
        `;
        const request = await connection.request()
        request.input("id", id);
        request.input("stall_id", inspectionInfo.stall_id);
        request.input("officer_id", inspectionInfo.officer_id);
        request.input("score", inspectionInfo.score);
        request.input("remarks", inspectionInfo.remarks);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return 
        }
        return retrieveInspectionByID(id);
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
    updateInspection
}