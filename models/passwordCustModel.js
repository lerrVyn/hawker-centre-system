// ziying
const sql = require("mssql");

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
  getCustomerPassword,
  updateCustomerPassword
};