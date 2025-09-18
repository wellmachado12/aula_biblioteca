require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.json()); // Descomentado para o middleware funcionar

const pool = mysql.createPool({
    host: process.env.DB_HOST, //onde o servidor é executado
    user: process.env.DB_USER, //nome de usuário para se conectar ao banco
    password: process.env.DB_PASSWORD, //senha do usuario
    database: process.env.DB_DATABASE, //nome do banco de dados
    waitForConnections: true, //se true, as requisições que excederem o número de conexões ficarão na fila de espera, se false geram erro imediatamente
    connectionLimit: 10, //numero máximo de conexões simuntâneas
    queueLimit: 0 //número maximo de requisições na fila de espera
}).promise();

// Middleware de Validação para livros
const validaDadosLivro = (req, res, next) => {
    const { titulo, ano_publicacao } = req.body;

    // Se algum campo estiver faltando, retorna um erro 400
    if (!titulo || !ano_publicacao) {
        return res.status(400).json({ error: 'Título e ano de publicação são obrigatórios.' });
    }

    // Se tudo estiver correto, chama next() para continuar
    next();
};

//Aqui é a lógica para buscar os livros no banco de dados.
app.get('/api/livros/pesquisar', async (req, res) => {
    try {
        const termo = req.query.termo;

        if (!termo) {
            return res.json([]);
        }

        const termoDeBusca = `%${termo}%`;
        const sql = `
            SELECT
                L.livro_id,
                L.titulo,
                L.ano_publicacao,
                L.genero,
                GROUP_CONCAT(A.nome SEPARATOR ', ') AS autores
            FROM LIVRO AS L
            JOIN LIVRO_AUTOR AS LA ON L.livro_id = LA.livro_id
            JOIN AUTOR AS A ON LA.autor_id = A.autor_id
            WHERE L.titulo LIKE ? OR A.nome LIKE ?
            GROUP BY L.livro_id
            ORDER BY L.titulo;
        `;

        const [results] = await pool.query(sql, [termoDeBusca, termoDeBusca]);
        res.json(results);

    } catch (err) {
        // Se qualquer erro acontecer no bloco 'try', ele será capturado aqui
        console.error("ERRO NO BACKEND:", err); // Mostra o erro detalhado no terminal do servidor
        res.status(500).json({ error: 'Ocorreu um erro no servidor ao processar sua busca.' });
    }
});

//Aqui é a lógica que o usuário pode adicionar um livro novo ao banco de dados.
// Agora usando o middleware validaDadosLivro
app.post('/api/livros/novo', validaDadosLivro, async (req, res) => {
    try {
        const { titulo, ano_publicacao, genero } = req.body;
        const sql = "INSERT INTO LIVRO (titulo, ano_publicacao, genero) VALUES (?, ?, ?)";
        const [result] = await pool.query(sql, [titulo, ano_publicacao, genero]);
        res.json({ message: 'Livro adicionado com sucesso', livro_id: result.insertId });
    } catch (err) {
        console.error("Erro ao adicionar livro, por favor tente novamente.", err)
        res.status(500).json({ error: "Aconteceu um erro ao adicionar livro." })
    }
})

app.get('/api/autores', express.json(), async (req, res) => {
    try {
        const [autores] = await pool.query('SELECT * FROM AUTOR ORDER BY nome;');
        res.json(autores);
    } catch (err) {
        console.error('Erro ao buscar autores:', err);
        res.status(500).json({ error: 'Ocorreu um erro ao buscar autores.' })
    }
});

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Servidor da biblioteca rodando em http://localhost:${port}`);
});

//Aqui é a lógica onde podemos excluir um livro do banco de dados pela página web.
app.delete('/api/livros/:id', async (req, res) => {
    try {
        const livroId = req.params.id;

        //Primeiro, deletar as associações na tabela LIVRO_AUTOR
        await pool.query('DELETE FROM LIVRO_AUTOR WHERE livro_id = ?', [livroId]);

        //Depois, deletar o livro da tabela LIVRO
        const [result] = await pool.query('DELETE FROM LIVRO WHERE livro_id = ?', [livroId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Livro não encontrado.' })
        }

        res.json({ message: 'Livro deletado com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar livro:', err)
        res.status(500).json({ error: 'Ocorreu um erro ao deletar o livro' })
    }
});

app.get('/api/generos', express.json(), async (req, res) => {
    try {
        const [generos] = await pool.query('SELECT * FROM GENERO ORDER BY nome;');
        res.json(generos);
    } catch (err) {
        console.error('Erro ao buscar generos:', err);
        res.status(500).json({ error: 'Ocorreu um erro ao buscar generos.' })
    }
});

app.post('/api/generos', express.json(), async (req, res) => {
    try {
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome do gênero é obrigatório.' });
        }

        const sql = "INSERT INTO GENERO (nome) VALUES (?)";
        const [result] = await pool.query(sql, [nome]);

        res.status(201).json({
            message: 'Gênero criado com sucesso!',
            genero_id: result.insertId,
            nome: nome
        });

    } catch (err) {
        console.error('Erro ao criar gênero:', err);
        res.status(500).json({ error: 'Ocorreu um erro ao criar o gênero.' });
    }
});