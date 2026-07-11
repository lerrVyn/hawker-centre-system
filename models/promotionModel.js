const sql = require("mssql");

async function getAllPromotions() {
    const result = await sql.query(`
        SELECT *
        FROM promotions
        ORDER BY start_date DESC
    `);

    return result.recordset;
}

async function getPromotionById(id) {
    const result = await sql.query`
        SELECT *
        FROM promotions
        WHERE promo_id = ${id}
    `;

    return result.recordset[0];
}

async function createPromotion(promotion) {

    const {
        stall_id,
        promo_name,
        discount_percent,
        start_date,
        end_date,
        description
    } = promotion;

    await sql.query`
        INSERT INTO promotions
        (
            stall_id,
            promo_name,
            discount_percent,
            start_date,
            end_date,
            description
        )
        VALUES
        (
            ${stall_id},
            ${promo_name},
            ${discount_percent},
            ${start_date},
            ${end_date},
            ${description}
        )
    `;
}

async function updatePromotion(id, promotion) {

    const {
        promo_name,
        discount_percent,
        start_date,
        end_date,
        description
    } = promotion;

    await sql.query`
        UPDATE promotions
        SET
            promo_name = ${promo_name},
            discount_percent = ${discount_percent},
            start_date = ${start_date},
            end_date = ${end_date},
            description = ${description}
        WHERE promo_id = ${id}
    `;
}

async function deletePromotion(id) {

    await sql.query`
        DELETE FROM promotions
        WHERE promo_id = ${id}
    `;
}

module.exports = {
    getAllPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion
};