const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get customer profile
async function getCustomerProfile(customerId) {
    const connection = await sql.connect(dbConfig);

    const request = connection.request();
    request.input("customerId", sql.Int, customerId);

    const result = await request.query(`
        SELECT
            customer_id,
            name,
            email,
            phone,
            created_at
        FROM customers
        WHERE customer_id = @customerId
    `);

    return result.recordset[0];
}

// Update customer profile
async function updateCustomerProfile(customerId, name, phone) {
    const connection = await sql.connect(dbConfig);

    const request = connection.request();

    request.input("customerId", sql.Int, customerId);
    request.input("name", sql.NVarChar, name);
    request.input("phone", sql.NVarChar, phone);

    await request.query(`
        UPDATE customers
        SET
            name = @name,
            phone = @phone
        WHERE customer_id = @customerId
    `);

    return await getCustomerProfile(customerId);
}

module.exports = {
    getCustomerProfile,
    updateCustomerProfile
};