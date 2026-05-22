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

let poolPromise = null;

async function getConnection() {

    try {

        if (!poolPromise) {

            poolPromise = sql.connect(config);

            console.log('Conectando ao banco...');
        }

        const pool = await poolPromise;

        return pool;

    } catch (err) {

        poolPromise = null;

        console.error('Erro na conexão:', err);

        throw err;
    }
}

module.exports = {
    getConnection
};