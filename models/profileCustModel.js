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

async function getCustomerByEmail(email) {
  const connection = await sql.connect(dbConfig);

  const request = connection.request();
  request.input("email", sql.NVarChar, email);

  const result = await request.query(`
    SELECT
      customer_id,
      name,
      email,
      phone,
      created_at
    FROM customers
    WHERE email = @email
  `);

  return result.recordset[0];
}

// Update customer profile
async function updateCustomerProfile(customerId, name, email, phone) {
  const connection = await sql.connect(dbConfig);

  const request = connection.request();

  request.input("customerId", sql.Int, customerId);
  request.input("name", sql.NVarChar, name);
  request.input("email", sql.NVarChar, email);
  request.input("phone", sql.NVarChar, phone);

  await request.query(`
    UPDATE customers
    SET
      name = @name,
      email = @email,
      phone = @phone
    WHERE customer_id = @customerId
  `);

  return await getCustomerProfile(customerId);
}
// Get customer's current password hash
async function getCustomerPassword(customerId) {
  const result = await sql.query`
    SELECT customer_id, password_hash
    FROM customers
    WHERE customer_id = ${customerId}
  `;

  return result.recordset[0];
}

// Update customer's password hash
async function updateCustomerPassword(customerId, passwordHash) {
  const result = await sql.query`
    UPDATE customers
    SET password_hash = ${passwordHash}
    OUTPUT INSERTED.customer_id
    WHERE customer_id = ${customerId}
  `;

  return result.recordset[0];
}

module.exports = {
    getCustomerProfile,
    getCustomerByEmail,
    updateCustomerProfile,
    getCustomerPassword,
    updateCustomerPassword
};