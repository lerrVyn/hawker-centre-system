// Ge Siyu

const sql = require("mssql");

// ==========================
// Sales Dashboard Summary
// ==========================
async function getSalesSummary(stallId) {

    // Total Revenue
    const revenueResult = await sql.query`

        SELECT
            ISNULL(SUM(total_price), 0) AS totalRevenue

        FROM orders

        WHERE
            stall_id = ${stallId}
            AND status = 'Completed'

    `;

    // Total Orders
    const orderResult = await sql.query`

        SELECT
            COUNT(*) AS totalOrders

        FROM orders

        WHERE
            stall_id = ${stallId}
            AND status = 'Completed'

    `;

    // Average Order Value
    const averageResult = await sql.query`

        SELECT
            ISNULL(AVG(total_price), 0) AS averageOrderValue

        FROM orders

        WHERE
            stall_id = ${stallId}
            AND status = 'Completed'

    `;

    return {

        totalRevenue:
            revenueResult.recordset[0].totalRevenue,

        totalOrders:
            orderResult.recordset[0].totalOrders,

        averageOrderValue:
            averageResult.recordset[0].averageOrderValue

    };

}

// ==========================
// Top Selling Menu Items
// ==========================
async function getTopSellingItems(stallId) {

    const result = await sql.query`

        SELECT

            m.item_name,

            SUM(oi.quantity) AS totalSold

        FROM order_items oi

        INNER JOIN menu_items m
            ON oi.item_id = m.item_id

        INNER JOIN orders o
            ON oi.order_id = o.order_id

        WHERE

            o.stall_id = ${stallId}

            AND o.status = 'Completed'

        GROUP BY

            m.item_name

        ORDER BY

            totalSold DESC

    `;

    return result.recordset;

}

// ==========================
// Daily Sales
// ==========================
async function getDailySales(stallId) {

    const result = await sql.query`

        SELECT

            CAST(created_at AS DATE) AS saleDate,

            SUM(total_price) AS revenue

        FROM orders

        WHERE

            stall_id = ${stallId}

            AND status = 'Completed'

        GROUP BY

            CAST(created_at AS DATE)

        ORDER BY

            saleDate

    `;

    return result.recordset;

}

module.exports = {

    getSalesSummary,

    getTopSellingItems,

    getDailySales

};