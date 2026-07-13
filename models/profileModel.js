//siyu
const sql = require("mssql");

// Get stall profile by owner ID
async function getProfile(ownerId) {
    const result = await sql.query`
        SELECT
            stall_id,
            stall_name,
            description,
            cuisine_type,
            operating_hours,
            hygiene_grade,
            owner_id
        FROM stalls
        WHERE owner_id = ${ownerId}
    `;

    return result.recordset[0];
}

// Update stall profile
async function updateProfile(ownerId, profile) {

    const {
        stall_name,
        description,
        cuisine_type,
        operating_hours
    } = profile;

    await sql.query`
        UPDATE stalls
        SET
            stall_name = ${stall_name},
            description = ${description},
            cuisine_type = ${cuisine_type},
            operating_hours = ${operating_hours}
        WHERE owner_id = ${ownerId}
    `;
}

module.exports = {
    getProfile,
    updateProfile
};

