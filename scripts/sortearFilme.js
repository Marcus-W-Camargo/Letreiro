import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    console.log("Iniciando sorteio diário de cinema via API TMDB...");

    const hoje = new Date().toISOString().split('T')[0];

    const configuracaoAxios = {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${tmdbToken.trim()}`
      }
    };

    // Sorteia uma página entre 1 e 10
    const paginaAleatoria = Math.floor(Math.random() * 40) + 1;

    console.log(`Consultando página ${paginaAleatoria} do TMDB...`);

    const urlTMDB =
      `https://api.themoviedb.org/3/discover/movie` +
      `?include_adult=false` +
      `&language=pt-BR` +
      `&sort_by=popularity.desc` +
      `&vote_average.gte=6` +
      `&vote_count.gte=850` +
      `&page=${paginaAleatoria}`;

    const respostaTMDB = await axios.get(
      urlTMDB,
      configuracaoAxios
    );

    const dadosTMDB = respostaTMDB.data;

    if (!dadosTMDB.results || dadosTMDB.results.length === 0) {
      throw new Error(
        "Nenhum filme foi retornado na resposta do TMDB."
      );
    }

    // Filtra filmes sem números no título
    const filmesElegiveis = dadosTMDB.results.filter(filme => {
      const temNumero = /\d/.test(filme.title);

      return (
        !temNumero &&
        filme.title &&
        filme.title.trim().length > 0
      );
    });

    if (filmesElegiveis.length === 0) {
      throw new Error(
        "Nenhum filme sem números foi encontrado nesta página."
      );
    }

    // Sorteia um filme
    const filmeSorteado =
      filmesElegiveis[
        Math.floor(Math.random() * filmesElegiveis.length)
      ];

    console.log(
      `Filme sorteado: ${filmeSorteado.title}`
    );

    // Busca detalhes do filme
    const urlDetalhes =
      `https://api.themoviedb.org/3/movie/${filmeSorteado.id}` +
      `?language=pt-BR`;

    const respostaDetalhes = await axios.get(
      urlDetalhes,
      configuracaoAxios
    );

    const detalhes = respostaDetalhes.data;

    const estudioNome =
      detalhes.production_companies &&
      detalhes.production_companies.length > 0
        ? detalhes.production_companies[0].name
        : 'Independente';

    const categoriesLista =
      detalhes.genres && detalhes.genres.length > 0
        ? detalhes.genres.map(g => g.name)
        : ['Cinema'];

    const novoDesafioDiario = {
      release_date: hoje,
      tmdb_id: filmeSorteado.id,
      title_brazil: higienizarTitulo(filmeSorteado.title),
      studio: estudioNome,
      categories: categoriesLista,

      poster_url: filmeSorteado.poster_path
        ? `https://image.tmdb.org/t/p/w500${filmeSorteado.poster_path}`
        : ''
    };

    // Salva no Supabase
    const { error } = await supabase
      .from('daily_movies')
      .insert([novoDesafioDiario]);

    if (error) {
      if (error.code === '23505') {
        console.log(
          "O filme de hoje já foi inserido anteriormente no banco."
        );
      } else {
        throw error;
      }
    } else {
      console.log(
        `Sucesso! Desafio ${novoDesafioDiario.title_brazil} salvo para ${hoje}.`
      );
    }

  } catch (err) {
    console.error(
      "Falha ao rodar automação do servidor:",
      err.response?.data || err.message
    );

    process.exit(1);
  }
}

rodarAutomacaoDiaria();