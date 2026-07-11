//ziying
const sql = require("mssql");

async function getCustomerByEmail(email) {
  const result = await sql.query`
    SELECT customer_id, name, email, password_hash, phone, created_at
    FROM customers
    WHERE email = ${email}
  `;

  return result.recordset[0];
}

async function createCustomer(name, email, passwordHash, phone) {
  const result = await sql.query`
    INSERT INTO customers (name, email, password_hash, phone)
    OUTPUT
      INSERTED.customer_id,
      INSERTED.name,
      INSERTED.email,
      INSERTED.phone,
      INSERTED.created_at
    VALUES (${name}, ${email}, ${passwordHash}, ${phone || null})
  `;

  return result.recordset[0];
}

module.exports = {
  getCustomerByEmail,
  createCustomer
};