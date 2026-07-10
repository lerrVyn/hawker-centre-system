//ziying
const sql = require("mssql");

// Check if email already exists
async function getCustomerByEmail(email) {

    const result = await sql.query`
        SELECT *
        FROM customers
        WHERE email = ${email}
    `;

    return result.recordset[0];
}

module.exports = {
    getCustomerByEmail
};