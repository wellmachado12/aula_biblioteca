const caixaDeBusca = document.getElementById('caixaDeBusca');
const botaoDeBusca = document.getElementById('botaoDeBusca');
const resultadosDiv = document.getElementById('resultados');

const realizarBusca = () => {
    const termo = caixaDeBusca.value;

    if (termo.length < 2) { // Evita buscas com menos de 2 caracteres
        resultadosDiv.innerHTML = '<p>Digite pelo menos 2 caracteres para buscar.</p>';
        return;
    }

    fetch(`/api/livros/pesquisar?termo=${encodeURIComponent(termo)}`)
        .then(response => response.json()) // Converte a resposta para JSON
        .then(livros => {
            exibirResultados(livros);
        })
        .catch(error => {
            console.error('Erro ao buscar livros:', error);
            resultadosDiv.innerHTML = '<p>Ocorreu um erro ao realizar a busca. Tente novamente.</p>';
        });
};

const exibirResultados = (livros) => {
    resultadosDiv.innerHTML = '';

    if (livros.length === 0) {
        resultadosDiv.innerHTML = '<p>Nenhum livro encontrado para o termo buscado.</p>';
        return;
    }

    livros.forEach(livro => {
        const livroCard = document.createElement('div');
        livroCard.className = 'livro-card';
        livroCard.innerHTML = `
            <h3>${livro.titulo}</h3>
            <p><strong>Autor(es):</strong> ${livro.autores}</p>
            <p><strong>Gênero:</strong> ${livro.genero}</p>
            <p><strong>Ano:</strong> ${livro.ano_publicacao}</p>
            <button class="botao-excluir" data-id="${livro.livro_id}">Excluir</button>
        `;
        resultadosDiv.appendChild(livroCard);
    });

    excluirLivro();
};

const excluirLivro = () => {
    const botaoExcluir = document.querySelectorAll('.botao-excluir');

    botaoExcluir.forEach(botao => {
        botao.addEventListener('click', async () => {
            const livroId = botao.getAttribute('data-id');

            try {
                const resposta = await fetch(`/api/livros/${livroId}`, {
                    method: 'DELETE'
                });

                if (resposta.ok) {
                    botao.parentElement.remove();
                    mostrarMensagem('Livro excluído com sucesso!', true);
                } else {
                    mostrarMensagem('Erro ao excluir o livro.', false);
                }
            } catch (erro) {
                console.error('Erro na requisição DELETE', erro);
                mostrarMensagem('Erro de conexão ao excluir o livro.', false)
            }
        });
    });
};

const mostrarMensagem = (texto, sucesso) => {
    const divMensagem = document.getElementById('mensagemFeedback');
    divMensagem.textContent = texto;
    divMensagem.style.color = sucesso ? 'green' : 'red';
    setTimeout(() => divMensagem.textContent = '', 3000);
}

botaoDeBusca.addEventListener('click', realizarBusca);
caixaDeBusca.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        realizarBusca();
    }
});

const botaoAdicionar = document.getElementById('botaoAdicionar');
botaoAdicionar.addEventListener('click', () => {
    const tituloLivro = document.getElementById('tituloLivro').value;
    const anoLivro = document.getElementById('anoLivro').value;
    const generoLivro = document.getElementById('generoLivro').value;

    if (!tituloLivro || !generoLivro || !anoLivro) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    fetch('/api/livros/novo', {
        method: 'POST',
        headers: {
            'content-Type': 'application/json'
        },
        body: JSON.stringify({ titulo: tituloLivro, ano_publicacao: anoLivro, genero: generoLivro })
    })
        .then(response => {
            if (response) {
                alert('Livro adicionado com sucesso')
                document.getElementById('tituloLivro').value = '';
                document.getElementById('anoLivro').value = '';
                document.getElementById('generoLivro').value = '';
                realizarBusca();
            } else {
                alert('Erro ao adicionar livro');
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar livro', error);
        })
})

const botaoListarAutores = document.getElementById('botaoListarAutores');
const listaAutores = document.getElementById('listaAutores');

botaoListarAutores.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/autores');
        if (!response.ok) {
            throw new Error('Erro ao buscar autores');
        }
        const autores = await response.json();
        listaAutores.innerHTML = '';
        autores.forEach(autor => {
            const li = document.createElement('li');
            li.textContent = autor.nome;
            listaAutores.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao listar autores:', error);
        alert('Ocorreu um erro ao lista os autores.')
    }
});
