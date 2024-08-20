require("dotenv").config();
const Pool = require("pg").Pool;

const pool = new Pool({
    user:process.env.user,
    password: process.env.password,
    host: process.env.host,
    port: process.env.port,
    database: process.env.database,
    idleTimeoutMillis: 30000,  // 30 seconds
    connectionTimeoutMillis: 2000,
    maxUsers:10,
});

module.exports = pool;
