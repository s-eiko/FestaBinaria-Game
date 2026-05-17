const express = require('express');
const session = require('express-session');
const cors = require('cors');

const {
    initConnection,
    getConnection
} = require('./connect.js');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'https://festa-binaria-game.vercel.app',
    credentials: true
}));

app.use(express.json());

app.set('trust proxy', 1);

app.use(session({
    secret: 'festa-binaria-secret',
    resave: false,
    saveUninitialized: false,
        cookie: {
            secure: true,
            sameSite: 'none'
        }
}));

// CADASTRO
app.post('/registration', async (req, res) => {
    const { Usuario, Nome, Senha } = req.body;
    try {
        const pool = getConnection();
        const checkUser = await pool
            .request()
            .input('Usuario', Usuario)
            .query(`
                SELECT *
                FROM usuarios
                WHERE Usuario = @Usuario
            `);
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Usuário já existe.'
            });
        }

        await pool
            .request()
            .input('Usuario', Usuario)
            .input('Nome', Nome)
            .input('Senha', Senha)
            .query(`
                INSERT INTO usuarios
                (
                    Usuario,
                    Nome,
                    Senha,
                    Pontos,
                    Jogos
                )
                VALUES
                (
                    @Usuario,
                    @Nome,
                    @Senha,
                    0,
                    0
                )
            `);

        const result = await pool
            .request()
            .input('Usuario', Usuario)
            .query(`
                SELECT *
                FROM usuarios
                WHERE Usuario = @Usuario
            `);
        const usuario = result.recordset[0];

        req.session.user = usuario;
        res.json({
            success: true,
            message: 'Cadastro realizado com sucesso.',
            usuario
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Erro no servidor.'
        });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    const { Usuario, Senha } = req.body;
    try {
        const pool = getConnection();
        const result = await pool
            .request()
            .input('Usuario', Usuario)
            .input('Senha', Senha)
            .query(`
                SELECT *
                FROM usuarios
                WHERE Usuario = @Usuario
                AND Senha = @Senha
            `);
        if (result.recordset.length > 0) {
            const usuario = result.recordset[0];
            req.session.user = usuario;
            return res.json({
                success: true,
                message: 'Login realizado com sucesso.',
                usuario
            });
        }

        res.status(401).json({
            success: false,
            message: 'Usuário ou senha inválidos.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Erro no servidor.'
        });
    }
});

// LOGOUT
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true,
            message: 'Logout realizado com sucesso.'
        });
    });
});

// VERIFICAR LOGIN
app.get('/check-login', (req, res) => {
    if (req.session.user) {
        return res.json({
            logged: true,
            usuario: req.session.user
        });
    }

    res.json({
        logged: false
    });
});

// ROTA PROTEGIDA
app.get('/data', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Usuário não autenticado.'
        });
    }
    try {
        const pool = getConnection();
        const result = await pool
            .request()
            .query('SELECT * FROM usuarios');

        res.json(result.recordset);
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).send('Erro ao buscar dados');
    }
});

// ATUALIZAR PONTOS
app.put('/update-points', async (req, res) => {
    console.log("BODY:", req.body);
    console.log("SESSION:", req.session.user);
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuário não autenticado.'
        });
    }

    const pontosGanhos = Number(req.body.pontosGanhos);

    if (isNaN(pontosGanhos)) {
        return res.status(400).json({
            success: false,
            message: 'Pontos inválidos.'
        });
    }

    try {
        const pool = getConnection();
        // UPDATE
        const updateResult = await pool
            .request()
            .input(
                'ID',
                req.session.user.ID
            )
            .input(
                'PontosGanhos',
                pontosGanhos
            )
            .query(`
                UPDATE usuarios
                SET
                    Pontos =
                        ISNULL(Pontos, 0)
                        + @PontosGanhos,

                    Jogos =
                        ISNULL(Jogos, 0)
                        + 1

                WHERE ID = @ID
            `);
        console.log(
            "UPDATE:",
            updateResult.rowsAffected
        );

        const result = await pool
            .request()
            .input(
                'ID',
                req.session.user.ID
            )
            .query(`
                SELECT *
                FROM usuarios
                WHERE ID = @ID
            `);
        const usuarioAtualizado = result.recordset[0];

        console.log(
            "USUÁRIO ATUALIZADO:",
            usuarioAtualizado
        );
        req.session.user = usuarioAtualizado;
        res.json({
            success: true,
            usuario: usuarioAtualizado
        });
    } catch (err) {
        console.error(
            "ERRO UPDATE:",
            err
        );
        res.status(500).json({
            success: false,
            message:
                'Erro ao atualizar pontos.'
        });
    }
});

// RANKING
app.get('/ranking', async (req, res) => {
    try {
        const pool = getConnection();
        const result = await pool
            .request()
            .query(`SELECT * FROM ranking`);
        res.json({
            success: true,
            ranking: result.recordset
        });
    } catch (err) {
        console.error(
            'Erro ao buscar ranking:',
            err
        );
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar ranking.'
        });
    }
});

async function startServer() {
    await initConnection();
    app.listen(PORT, () => {
        console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
}
startServer();