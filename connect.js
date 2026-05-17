const sql = require('mssql');

const config = {
    user: 'connection',
    password: 'projetobinario',
    server: '127.0.0.1',
    port: 1433,
    database: 'FestaBinaria',
    options: {
        encrypt: false,
        trustServerCertificate: true
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