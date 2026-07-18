// Wei Ye
const { sql, poolPromise } = require("../dbConnection");
const { getGrade } = require("./utility");

async function retrieveAllInspection() {
    try {
        const connection = await poolPromise;
        const query = `
            SELECT
                i.inspection_id,
                i.stall_id,
                s.stall_name,
                i.officer_id,
                o.name AS officer_name,
                i.score,
                hg.grade,
                i.remarks,
                i.inspection_date
            FROM inspections i
            JOIN stalls s
                ON i.stall_id = s.stall_id
            JOIN nea_officers o
                ON i.officer_id = o.officer_id
            LEFT JOIN hygiene_grades hg
                ON i.inspection_id = hg.inspection_id
        `
        
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
        const query = `
            SELECT
                i.inspection_id,
                i.stall_id,
                s.stall_name,
                i.officer_id,
                o.name AS officer_name,
                i.score,
                hg.grade,
                i.remarks,
                i.inspection_date
            FROM inspections i
            JOIN stalls s
                ON i.stall_id = s.stall_id
            JOIN nea_officers o
                ON i.officer_id = o.officer_id
            LEFT JOIN hygiene_grades hg
                ON i.inspection_id = hg.inspection_id
        `
        
        const request = await connection.request()
        request.input("id", id);
        const result = await request.query(query);
        
        return result.recordset[0] || null;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function createInspection(inspectionInfo) {
    try {
        const connection = await poolPromise;
        let remarks = inspectionInfo.remarks || "None";
        const query = `
            insert into inspections (stall_id, officer_id, score, remarks) values (@stall_id, @officer_id, @score, @remarks); 
            select scope_identity() as id;
            update stalls set hygiene_grade = @grade where stall_id = @stall_id;
        `;

        // if (!inspectionInfo.remarks) { remarks = "None"}

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
        const oldInspection = await retrieveInspectionByID(id);

        const stall_id = inspectionInfo.stall_id ?? oldInspection.stall_id;
        const officer_id = inspectionInfo.officer_id ?? oldInspection.officer_id;
        const score = inspectionInfo.score ?? oldInspection.score;
        const remarks = inspectionInfo.remarks ?? oldInspection.remarks;

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
        request.input("stall_id", stall_id);
        request.input("officer_id", officer_id);
        request.input("score", score);
        request.input("remarks", remarks);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null
        }
        return await retrieveInspectionByID(id);
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