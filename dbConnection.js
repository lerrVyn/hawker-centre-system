// Wei ye
const sql = require("mssql");
const dbConfig = require("./dbConfig");

const poolPromise = sql.connect(dbConfig);

module.exports = {
    sql,
    poolPromise
}