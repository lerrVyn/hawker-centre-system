const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function makePayment(orderId, paymentMethod) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const orderResult = await new sql.Request(transaction)
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT order_id, status
        FROM dbo.orders
        WHERE order_id = @orderId
      `);

    if (orderResult.recordset.length === 0) {
      throw new Error("Order not found.");
    }

    const existingPaymentResult = await new sql.Request(transaction)
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT payment_id
        FROM dbo.payments
        WHERE order_id = @orderId
      `);

    if (existingPaymentResult.recordset.length > 0) {
      throw new Error("A payment already exists for this order.");
    }

    const paymentResult = await new sql.Request(transaction)
      .input("orderId", sql.Int, orderId)
      .input("paymentMethod", sql.NVarChar(50), paymentMethod)
      .query(`
        INSERT INTO dbo.payments (
          order_id,
          payment_method,
          payment_status,
          paid_at
        )
        OUTPUT INSERTED.payment_id
        VALUES (
          @orderId,
          @paymentMethod,
          'Paid',
          GETDATE()
        )
      `);

    await new sql.Request(transaction)
      .input("orderId", sql.Int, orderId)
      .query(`
        UPDATE dbo.orders
        SET status = 'Paid'
        WHERE order_id = @orderId
      `);

    await transaction.commit();

    return {
      paymentId: paymentResult.recordset[0].payment_id
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("PAYMENT ROLLBACK ERROR:", rollbackError);
    }

    throw err;
  }
}

async function getPayment(orderId) {
  const pool = await sql.connect(dbConfig);

  const result = await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .query(`
      SELECT
        payment_id,
        order_id,
        payment_method,
        payment_status,
        paid_at
      FROM dbo.payments
      WHERE order_id = @orderId
    `);

  return result.recordset[0] || null;
}

async function updatePaymentStatus(paymentId, paymentStatus) {
  const pool = await sql.connect(dbConfig);

  const result = await pool
    .request()
    .input("paymentId", sql.Int, paymentId)
    .input("paymentStatus", sql.NVarChar(50), paymentStatus)
    .query(`
      UPDATE dbo.payments
      SET
        payment_status = @paymentStatus,
        paid_at =
          CASE
            WHEN @paymentStatus = 'Paid' THEN GETDATE()
            ELSE paid_at
          END
      WHERE payment_id = @paymentId
    `);

  return result.rowsAffected[0] > 0;
}

module.exports = {
  makePayment,
  getPayment,
  updatePaymentStatus
};