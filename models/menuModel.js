// Ge Siyu

const sql = require("mssql");

// Get all menu items belonging to a stall
async function getMenuItems(stallId) {

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

        ORDER BY item_name

    `;

    return result.recordset;

}

// Get one menu item
async function getMenuItem(itemId) {

    const result = await sql.query`

        SELECT *

        FROM menu_items

        WHERE item_id = ${itemId}

    `;

    return result.recordset[0];

}

// Add menu item
async function createMenuItem(menu) {

    const {

        stall_id,
        item_name,
        description,
        price,
        is_available,
        image_url

    } = menu;

    await sql.query`

        INSERT INTO menu_items

        (

            stall_id,
            item_name,
            description,
            price,
            is_available,
            image_url

        )

        VALUES

        (

            ${stall_id},
            ${item_name},
            ${description},
            ${price},
            ${is_available},
            ${image_url}

        )

    `;

}

// Update menu item
async function updateMenuItem(itemId, menu) {

    const {

        item_name,
        description,
        price,
        is_available,
        image_url

    } = menu;

    await sql.query`

        UPDATE menu_items

        SET

            item_name=${item_name},
            description=${description},
            price=${price},
            is_available=${is_available},
            image_url=${image_url}

        WHERE item_id=${itemId}

    `;

}

// Delete menu item
async function deleteMenuItem(itemId) {

    await sql.query`

        DELETE FROM menu_items

        WHERE item_id=${itemId}

    `;

}

module.exports = {

    getMenuItems,

    getMenuItem,

    createMenuItem,

    updateMenuItem,

    deleteMenuItem

};