const sql = require("mssql");
const dbConfig = require("../dbConfig");

// ==========================
// Make Payment
// ==========================

async function makePayment(data) {

    const pool = await sql.connect(dbConfig);

    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        const request = new sql.Request(transaction);

        // Check order exists
        const order = await request

            .input("orderId", sql.Int, data.orderId)

            .query(`
                SELECT *
                FROM orders
                WHERE order_id=@orderId
            `);

        if (order.recordset.length === 0)
            throw new Error("Order not found.");

        // Insert payment
        const payment = await request

            .input("orderId", sql.Int, data.orderId)
            .input("paymentMethod", sql.NVarChar, data.paymentMethod)

            .query(`

                INSERT INTO payments
                (order_id,payment_method,payment_status,paid_at)

                OUTPUT INSERTED.payment_id

                VALUES
                (@orderId,@paymentMethod,'Paid',GETDATE())

            `);

        // Update order status

        await request

            .input("orderId2", sql.Int, data.orderId)

            .query(`

                UPDATE orders

                SET status='Paid'

                WHERE order_id=@orderId2

            `);

        await transaction.commit();

        return {

            paymentId: payment.recordset[0].payment_id

        };

    }

    catch (err) {

        await transaction.rollback();
        throw err;

    }

}

// ==========================
// Get Payment
// ==========================

async function getPayment(orderId) {

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()

        .input("orderId", sql.Int, orderId)

        .query(`

            SELECT *

            FROM payments

            WHERE order_id=@orderId

        `);

    return result.recordset[0];

}

// ==========================
// Update Payment Status
// ==========================

async function updatePaymentStatus(paymentId, paymentStatus) {

    const pool = await sql.connect(dbConfig);

    await pool.request()

        .input("paymentId", sql.Int, paymentId)
        .input("paymentStatus", sql.NVarChar, paymentStatus)

        .query(`

            UPDATE payments

            SET payment_status=@paymentStatus

            WHERE payment_id=@paymentId

        `);

}

module.exports = {

    makePayment,
    getPayment,
    updatePaymentStatus

};