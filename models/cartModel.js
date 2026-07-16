const sql = require("mssql");
const dbConfig = require("../dbConfig");

// ======================
// VIEW CART
// ======================

async function getCart(customerId) {
  const pool = await sql.connect(dbConfig);

  const result = await pool
    .request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT
        ci.cart_item_id,
        mi.item_id,
        mi.item_name,
        mi.stall_id,
        s.stall_name,
        ci.price,
        ci.quantity,
        CAST(ci.price * ci.quantity AS DECIMAL(10,2)) AS subtotal
      FROM dbo.carts c
      INNER JOIN dbo.cart_items ci
        ON c.cart_id = ci.cart_id
      INNER JOIN dbo.menu_items mi
        ON ci.item_id = mi.item_id
      INNER JOIN dbo.stalls s
        ON mi.stall_id = s.stall_id
      WHERE c.customer_id = @customerId
      ORDER BY s.stall_name, ci.cart_item_id
    `);

  return result.recordset;
}

// ======================
// ADD ITEM
// ======================

async function addItem(data) {

    const pool = await sql.connect(dbConfig);

    // Find customer's cart

    let cart = await pool.request()

        .input("customerId", sql.Int, data.customerId)

        .query(`
            SELECT cart_id
            FROM carts
            WHERE customer_id=@customerId
        `);

    let cartId;

    if (cart.recordset.length === 0) {

        let newCart = await pool.request()

            .input("customerId", sql.Int, data.customerId)

            .query(`

                INSERT INTO carts(customer_id)

                OUTPUT INSERTED.cart_id

                VALUES(@customerId)

            `);

        cartId = newCart.recordset[0].cart_id;

    }
    else {

        cartId = cart.recordset[0].cart_id;

    }

    // Check existing item

    let existing = await pool.request()

        .input("cartId", sql.Int, cartId)

        .input("itemId", sql.Int, data.itemId)

        .query(`

            SELECT *

            FROM cart_items

            WHERE cart_id=@cartId

            AND item_id=@itemId

        `);

    if (existing.recordset.length > 0) {

        await pool.request()

            .input("quantity", sql.Int, data.quantity)

            .input("cartItemId", sql.Int, existing.recordset[0].cart_item_id)

            .query(`

                UPDATE cart_items

                SET quantity = quantity + @quantity

                WHERE cart_item_id=@cartItemId

            `);

    }

    else {

        let priceResult = await pool.request()

            .input("itemId", sql.Int, data.itemId)

            .query(`

                SELECT price

                FROM menu_items

                WHERE item_id=@itemId

            `);

        let price = priceResult.recordset[0].price;

        await pool.request()

            .input("cartId", sql.Int, cartId)

            .input("itemId", sql.Int, data.itemId)

            .input("quantity", sql.Int, data.quantity)

            .input("price", sql.Decimal(10,2), price)

            .query(`

                INSERT INTO cart_items

                (cart_id,item_id,quantity,price)

                VALUES

                (@cartId,@itemId,@quantity,@price)

            `);

    }

}

// ======================
// UPDATE QUANTITY
// ======================

async function updateQuantity(cartItemId, quantity) {

    const pool = await sql.connect(dbConfig);

    await pool.request()

        .input("cartItemId", sql.Int, cartItemId)

        .input("quantity", sql.Int, quantity)

        .query(`

            UPDATE cart_items

            SET quantity=@quantity

            WHERE cart_item_id=@cartItemId

        `);

}

// ======================
// REMOVE ITEM
// ======================

async function removeItem(cartItemId) {

    const pool = await sql.connect(dbConfig);

    await pool.request()

        .input("cartItemId", sql.Int, cartItemId)

        .query(`

            DELETE FROM cart_items

            WHERE cart_item_id=@cartItemId

        `);

}

module.exports = {

    getCart,
    addItem,
    updateQuantity,
    removeItem

};