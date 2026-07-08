// Wei Ye
const { sql, poolPromise } = require("../dbConnection");

async function retrieveAllInspection() {
    let connection;
    try {
        connection = await poolPromise;
        const query = "select inspection_id, stall_id, officer_id, score, remarks, inspection_date from inspections"
        const result = await connection.request().query(query);
        
        return result.recordset;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
    }
}

async function retrieveInspectionByID(id) {
    let connection;
    try {
        connection = await poolPromise;
        const query = "select inspection_id, stall_id, officer_id, score, remarks, inspection_date from inspections where inspection_id = @id"
        
        const request = await connection.request()
        request.input("id", id);
        const result = await request.query(query);
        return result.recordset[0];
    }
    catch (error) {
        console.log(`Database error: ${error}`)
    }
}

module.exports = {
    retrieveAllInspection,
    retrieveInspectionByID
}