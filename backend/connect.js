const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,

    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};
let pool;

async function initConnection() {
    try {
        pool = await sql.connect(config);
        console.log('Conexão bem sucedida!');
    } catch (err) {
        console.error('Erro na conexão:', err);
    }
}

function getConnection() {
    if (!pool) {
        throw new Error('Banco não conectado');
    }
    return pool;
}

async function endConnection() {
    if (pool) {
        await pool.close();
    }
}

module.exports = {
    initConnection,
    getConnection,
    endConnection
};