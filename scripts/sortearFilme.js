import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tmdbApiKey = process.env.TMDB_API_KEY;

// Função auxiliar para remover acentos e caracteres especiais (igual ao seu sistema)
function higienizarTitulo(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z\s]/g, "")    // Remove números e símbolos, mantém letras e espaços
    .toUpperCase()
    .trim();
}

async function rodarAutomacaoDiaria() {
  try {
    console.log("Iniciando sorteio diário de cinema via API...");
    const hoje = new Date().toISOString().split('T')[0];

    // 1. SORTEIO REAL: Busca uma página aleatória de filmes populares do TMDB
    const paginaAleatoria = Math.floor(Math.random() * 10) + 1; // Páginas 1 a 10
    const urlTMDB = `https://themoviedb.org{tmdbApiKey}&language=pt-BR&page=${paginaAleatoria}`;
    
    const respostaTMDB = await fetch(urlTMDB);
    const dadosTMDB = await respostaTMDB.json();

    if (!dadosTMDB.results || dadosTMDB.results.length === 0) {
      throw new Error("Falha ao puxar filmes do TMDB.");
    }

    // 2. Filtra apenas os filmes que possuem título utilizável (sem números no título traduzido)
    const filmesElegiveis = dadosTMDB.results.filter(filme => {
      const temNumero = /\d/.test(filme.title);
      return !temNumero && filme.title.trim().length > 0;
    });

    if (filmesElegiveis.length === 0) {
      throw new Error("Nenhum filme sem números foi encontrado nesta página.");
    }

    // Sorteia um dos filmes elegíveis da lista
    const filmeSorteado = filmesElegiveis[Math.floor(Math.random() * filmesElegiveis.length)];

    // 3. Busca detalhes extras do filme (como os estúdios produtores)
    const urlDetalhes = `https://themoviedb.org{filmeSorteado.id}?api_key=${tmdbApiKey}&language=pt-BR`;
    const respostaDetalhes = await fetch(urlDetalhes);
    const detalhes = await respostaDetalhes.json();

    const estúdioNome = detalhes.production_companies?.[0]?.name || 'Independente';
    const categoriasLista = detalhes.genres?.map(g => g.name) || ['Cinema'];

    // 4. Estrutura o objeto final idêntico ao esperado pelo Letreiro
    const novoDesafioDiario = {
      release_date: hoje,
      tmdb_id: filmeSorteado.id,
      title_brazil: higienizarTitulo(filmeSorteado.title),
      studio: estúdioNome,
      categories: categoriasLista,
      poster_url: filmeSorteado.poster_path ? `https://tmdb.org{filmeSorteado.poster_path}` : ''
    };

    // 5. Salva de forma blindada no Supabase
    const { error } = await supabase
      .from('daily_movies')
      .insert([novoDesafioDiario]);

    if (error) {
      if (error.code === '23505') {
        console.log("O filme de hoje já foi inserido anteriormente.");
      } else {
        throw error;
      }
    } else {
      console.log(`Sucesso! Desafio '${novoDesafioDiario.title_brazil}' salvo para ${hoje}.`);
    }

  } catch (err) {
    console.error("Falha ao rodar automação do servidor:", err.message);
    process.exit(1);
  }
}

rodarAutomacaoDiaria();
