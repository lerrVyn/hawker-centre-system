// Wei Ye
const { sql, poolPromise } = require("../dbConnection");

async function retrieveOfficerByEmail(email) {
    try {
        const connection = await poolPromise;
        const query = `select officer_id, name, email, password_hash from nea_officers where email = @email`;

        const request = await connection.request();
        request.input("email",email);
        const result = await request.query(query);

        return result.recordset[0] || null;
    }
    catch (error) {
        console.log(`Database error: ${error}`)
        throw error;
    }
}

module.exports = {
    retrieveOfficerByEmail
}