const sql = require("mssql");
const dbConfig = require("../dbConfig");

// ==========================
// Checkout
// ==========================
async function checkout(data) {

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        const request = new sql.Request(transaction);

        // Get customer's cart
        const cartResult = await request
            .input("customerId", sql.Int, data.customerId)
            .query(`
                SELECT cart_id
                FROM carts
                WHERE customer_id = @customerId
            `);

        if (cartResult.recordset.length === 0) {
            throw new Error("Cart not found.");
        }

        const cartId = cartResult.recordset[0].cart_id;

        // Get cart items
        const cartItems = await request
            .input("cartId", sql.Int, cartId)
            .query(`
                SELECT *
                FROM cart_items
                WHERE cart_id = @cartId
            `);

        if (cartItems.recordset.length === 0) {
            throw new Error("Cart is empty.");
        }

        // Calculate total
        let totalPrice = 0;

        cartItems.recordset.forEach(item => {
            totalPrice += item.price * item.quantity;
        });

        // Create order
        const orderResult = await request
            .input("customer_id", sql.Int, data.customerId)
            .input("stall_id", sql.Int, data.stallId)
            .input("total_price", sql.Decimal(10,2), totalPrice)
            .query(`
                INSERT INTO orders
                (customer_id, stall_id, total_price)

                OUTPUT INSERTED.order_id

                VALUES
                (@customer_id, @stall_id, @total_price)
            `);

        const orderId = orderResult.recordset[0].order_id;

        // Copy items to order_items
        for (const item of cartItems.recordset) {

            await request
                .input("order_id", sql.Int, orderId)
                .input("item_id", sql.Int, item.item_id)
                .input("quantity", sql.Int, item.quantity)
                .input("price", sql.Decimal(10,2), item.price)
                .query(`
                    INSERT INTO order_items
                    (order_id,item_id,quantity,price)

                    VALUES
                    (@order_id,@item_id,@quantity,@price)
                `);

        }

        // Clear cart
        await request
            .input("cartIdDelete", sql.Int, cartId)
            .query(`
                DELETE FROM cart_items
                WHERE cart_id=@cartIdDelete
            `);

        await transaction.commit();

        return {

            orderId,
            totalPrice

        };

    }

    catch (err) {

        await transaction.rollback();
        throw err;

    }

}

// ==========================
// Order History
// ==========================
async function getOrderHistory(customerId) {

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()

        .input("customerId", sql.Int, customerId)

        .query(`

            SELECT

                order_id,
                stall_id,
                total_price,
                status,
                created_at

            FROM orders

            WHERE customer_id=@customerId

            ORDER BY created_at DESC

        `);

    return result.recordset;

}

// ==========================
// Order Status
// ==========================
async function getOrderStatus(orderId) {

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()

        .input("orderId", sql.Int, orderId)

        .query(`

            SELECT

                order_id,
                status,
                created_at

            FROM orders

            WHERE order_id=@orderId

        `);

    return result.recordset[0];

}

module.exports = {

    checkout,
    getOrderHistory,
    getOrderStatus

};