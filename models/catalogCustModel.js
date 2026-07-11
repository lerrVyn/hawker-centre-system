// Ziying
const sql = require("mssql");

// Retrieve all stalls from the database
async function getAllStalls() {
  const result = await sql.query`
    SELECT
      stall_id,
      stall_name,
      description,
      cuisine_type,
      operating_hours,
      hygiene_grade
    FROM stalls
    ORDER BY stall_name
  `;

  return result.recordset;
}

// Retrieve available menu items for one stall
async function getMenuItemsByStallId(stallId) {
  const result = await sql.query`
    SELECT
      item_id,
      stall_id,
      item_name,
      description,
      price,
      is_available,
      image_url
    FROM menu_items
    WHERE stall_id = ${stallId}
      AND is_available = 1
    ORDER BY item_name
  `;

  return result.recordset;
}

module.exports = {
  getAllStalls,
  getMenuItemsByStallId
};