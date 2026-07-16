const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function checkout(customerId) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const cartItemsResult = await new sql.Request(transaction)
      .input("customerId", sql.Int, customerId)
      .query(`
        SELECT
          ci.cart_item_id,
          ci.item_id,
          ci.quantity,
          ci.price,
          mi.stall_id
        FROM dbo.carts c
        INNER JOIN dbo.cart_items ci
          ON c.cart_id = ci.cart_id
        INNER JOIN dbo.menu_items mi
          ON ci.item_id = mi.item_id
        WHERE c.customer_id = @customerId
      `);

    const cartItems = cartItemsResult.recordset;

    if (cartItems.length === 0) {
      throw new Error("The cart is empty.");
    }

    const totalPrice = cartItems.reduce(
      (total, item) =>
        total + Number(item.price) * Number(item.quantity),
      0
    );

    const orderResult = await new sql.Request(transaction)
      .input("customerId", sql.Int, customerId)
      .input("totalPrice", sql.Decimal(10, 2), totalPrice)
      .query(`
        INSERT INTO dbo.orders (
          customer_id,
          total_price,
          status,
          created_at
        )
        OUTPUT INSERTED.order_id
        VALUES (
          @customerId,
          @totalPrice,
          'Pending',
          GETDATE()
        )
      `);

    const orderId = orderResult.recordset[0].order_id;

    for (const item of cartItems) {
      await new sql.Request(transaction)
        .input("orderId", sql.Int, orderId)
        .input("itemId", sql.Int, item.item_id)
        .input("quantity", sql.Int, item.quantity)
        .input("price", sql.Decimal(10, 2), item.price)
        .query(`
          INSERT INTO dbo.order_items (
            order_id,
            item_id,
            quantity,
            price
          )
          VALUES (
            @orderId,
            @itemId,
            @quantity,
            @price
          )
        `);
    }

    await new sql.Request(transaction)
      .input("customerId", sql.Int, customerId)
      .query(`
        DELETE ci
        FROM dbo.cart_items ci
        INNER JOIN dbo.carts c
          ON ci.cart_id = c.cart_id
        WHERE c.customer_id = @customerId
      `);

    await transaction.commit();

    return {
      orderId,
      totalPrice
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("CHECKOUT ROLLBACK ERROR:", rollbackError);
    }

    throw err;
  }
}

// ==========================
// Order History
// ==========================
async function getOrderHistory(customerId) {
  const pool = await sql.connect(dbConfig);

  const result = await pool
    .request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT
        order_id,
        customer_id,
        total_price,
        status,
        created_at
      FROM dbo.orders
      WHERE customer_id = @customerId
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