import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tmdbToken = process.env.TMDB_API_KEY;

function higienizarTitulo(str) {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-zA-Z\s]/g, "")    
    .toUpperCase()
    .trim();
}

async function rodarAutomacaoDiaria() {
  try {
    console.log("Iniciando sorteio diário de cinema via API TMDB (com Axios)...");
    const hoje = new Date().toISOString().split('T')[0]; // Garante o fuso limpo e o índice exato

    const configuracaoAxios = {
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + tmdbToken.trim()
      }
    };

    // 1. SORTEIO REAL: Busca uma página aleatória de filmes populares do TMDB
    const paginaAleatoria = Math.floor(Math.random() * 10) + 1; 
    
    // Concatenação tradicional com sinal de mais (+) para garantir que o Git interprete sem erros
    const urlTMDB = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&language=pt-BR&sort_by=popularity.desc&vote_average.gte=6&vote_count.gte=850&page={paginaAleatoria}';
    
    const respostaTMDB = await axios.get(urlTMDB, configuracaoAxios);
    const dadosTMDB = respostaTMDB.data;

    if (!dadosTMDB.results || dadosTMDB.results.length === 0) {
      throw new Error("Nenhum filme foi retornado na resposta do TMDB.");
    }

    // 2. Filtra apenas os filmes que possuem título utilizável (sem números)
    const filmesElegiveis = dadosTMDB.results.filter(filme => {
      const temNumero = /\d/.test(filme.title);
      return !temNumero && filme.title.trim().length > 0;
    });

    if (filmesElegiveis.length === 0) {
      throw new Error("Nenhum filme sem números foi encontrado nesta página.");
    }

    // Sorteia um dos filmes elegíveis da lista
    const filmeSorteado = filmesElegiveis[Math.floor(Math.random() * filmesElegiveis.length)];

    // 3. Busca detalhes extras do filme (para pegar estúdios)
    const urlDetalhes = 'https://themoviedb.org' + filmeSorteado.id + '?language=pt-BR';
    const respostaDetalhes = await axios.get(urlDetalhes, configuracaoAxios);
    const detalhes = respostaDetalhes.data;

    // Acessa o nome do primeiro estúdio da lista com segurança array
    const estudioNome = detalhes.production_companies && detalhes.production_companies.length > 0
      ? detalhes.production_companies[0].name 
      : 'Independente';
      
    const categoriesLista = detalhes.genres 
      ? detalhes.genres.map(g => g.name) 
      : ['Cinema'];

    // 4. Estrutura o objeto final idêntico ao esperado pelo Letreiro
    const novoDesafioDiario = {
      release_date: hoje,
      tmdb_id: filmeSorteado.id,
      title_brazil: higienizarTitulo(filmeSorteado.title),
      studio: estudioNome,
      categories: categoriesLista,
      poster_url: filmeSorteado.poster_path ? 'https://tmdb.org' + filmeSorteado.poster_path : ''
    };

    // 5. Salva de forma blindada no Supabase
    const { error } = await supabase
      .from('daily_movies')
      .insert([novoDesafioDiario]);

    if (error) {
      if (error.code === '23505') {
        console.log("O filme de hoje já foi inserido anteriormente no banco.");
      } else {
        throw error;
      }
    } else {
      console.log('Sucesso Absoluto! Desafio ' + novoDesafioDiario.title_brazil + ' salvo para ' + hoje + '.');
    }

  } catch (err) {
    console.error("Falha ao rodar automação do servidor:", err.message);
    process.exit(1);
  }
}

rodarAutomacaoDiaria();
