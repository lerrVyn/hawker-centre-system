// Ge Siyu
const express = require("express");
const sql = require("mssql");

const router = express.Router();

router.post("/promotions", async (req, res) => {

    try {

        const {
            stall_id,
            promo_name,
            discount_percent,
            start_date,
            end_date,
            description
        } = req.body;

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

        res.status(201).json({
            message: "Promotion created successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

});

module.exports = router;