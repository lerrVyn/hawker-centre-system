// Wei Ye
const { sql, poolPromise } = require("../dbConnection");
const bcrypt = require("bcryptjs");

async function retrieveAllOfficer() {
    try {
        const connection = await poolPromise;
        const query = `select officer_id, name, email, password_hash from nea_officers`;

        const result = await connection.request().query(query);

        return result.recordset;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function retrieveOfficerById(id) {
    try {
        const connection = await poolPromise;
        const query = `select officer_id, name, email, password_hash from nea_officers where officer_id = @id`;

        const request = await connection.request();
        request.input("id",id);
        const result = await request.query(query);

        return result.recordset[0];
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function createOfficer(officerInfo) {
    try {
        const connection = await poolPromise;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(officerInfo.password, salt);
        const query = `insert into nea_officers (name, email, password_hash) values (@name, @email, @hash); select scope_identity() as id;`
        
        const request = await connection.request();
        request.input("name",officerInfo.name);
        request.input("email",officerInfo.email);
        request.input("hash",hash);
        const result = await request.query(query);
        const newOfficerID = result.recordset[0].id;

        return await retrieveOfficerById(newOfficerID);
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function updateOfficer(id, officerInfo) {
    try {
        const connection = await poolPromise;
        const oldOfficer = await retrieveOfficerById(id);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(officerInfo.password, salt);
        const query = `
            update nea_officers
            set
                name = @name,
                email = @email,
                password_hash = @hash
            where officer_id = @id;
        `;

        //////////////// //////////////////////////
        // INFO NOT STATED SHOULD NOT BE UPDATED //
        ///////////////////////////////////////////
        const request = await connection.request()
        request.input("id", id);
        request.input("name", officerInfo.name);
        request.input("email", officerInfo.email);
        request.input("hash", hash);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null
        }
        return retrieveOfficerById(id);
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

async function deleteOfficer(id) {
    try {
        const connection = await poolPromise;
        const deletedOfficer = await retrieveOfficerById(id);
        const query = `delete from nea_officers where officer_id = @id`;

        const request = await connection.request();
        request.input("id",id);
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return null
        }
        return deletedOfficer;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

module.exports = {
    retrieveAllOfficer,
    retrieveOfficerById,
    createOfficer,
    updateOfficer,
    deleteOfficer
}