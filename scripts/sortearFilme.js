import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tmdbToken = process.env.TMDB_API_KEY;
const MAX_TENTATIVAS = 60;
const TAMANHO_PAGINA_BANCO = 1000;

function higienizarTitulo(str) {
  if (!str) return '';

  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .trim();
}

function criarChaveTitulo(str) {
  return higienizarTitulo(str).replace(/\s+/g, "");
}

async function buscarFilmesJaUsados() {
  const idsJaUsados = new Set();
  const titulosJaUsados = new Set();
  let inicio = 0;

  while (true) {
    const { data, error } = await supabase
      .from('daily_movies')
      .select('tmdb_id, title_brazil')
      .range(inicio, inicio + TAMANHO_PAGINA_BANCO - 1);

    if (error) {
      throw error;
    }

    const registros = data || [];

    for (const registro of registros) {
      if (registro.tmdb_id !== null && registro.tmdb_id !== undefined) {
        idsJaUsados.add(Number(registro.tmdb_id));
      }

      if (registro.title_brazil) {
        titulosJaUsados.add(criarChaveTitulo(registro.title_brazil));
      }
    }

    if (registros.length < TAMANHO_PAGINA_BANCO) {
      break;
    }

    inicio += TAMANHO_PAGINA_BANCO;
  }

  return { idsJaUsados, titulosJaUsados };
}

async function buscarDesafioDoDia(hoje) {
  const { data, error } = await supabase
    .from('daily_movies')
    .select('tmdb_id, title_brazil')
    .eq('release_date', hoje)
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
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

    const desafioExistenteHoje = await buscarDesafioDoDia(hoje);

    if (desafioExistenteHoje) {
      console.log(
        `Já existe um desafio cadastrado para ${hoje}: ${desafioExistenteHoje.title_brazil}. Nenhum novo sorteio será feito.`
      );
      return;
    }

    const { idsJaUsados, titulosJaUsados } = await buscarFilmesJaUsados();

    console.log(
      `${idsJaUsados.size} filmes já utilizados foram carregados para a verificação de duplicidade.`
    );

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      const paginaAleatoria = Math.floor(Math.random() * 40) + 1;

      console.log(
        `Tentativa ${tentativa}/${MAX_TENTATIVAS}: consultando página ${paginaAleatoria} do TMDB...`
      );

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
        console.log(
          "Nenhum filme foi retornado nesta página. Tentando novamente..."
        );
        continue;
      }

      const filmesElegiveis = dadosTMDB.results.filter(filme => {
        if (!filme.title || filme.title.trim().length === 0) {
          return false;
        }

        const temNumero = /\d/.test(filme.title);
        const tituloHigienizado = higienizarTitulo(filme.title);
        const chaveTitulo = criarChaveTitulo(filme.title);
        const idJaUsado = idsJaUsados.has(Number(filme.id));
        const tituloJaUsado = titulosJaUsados.has(chaveTitulo);

        return (
          !temNumero &&
          tituloHigienizado.length > 0 &&
          !idJaUsado &&
          !tituloJaUsado
        );
      });

      if (filmesElegiveis.length === 0) {
        console.log(
          "Todos os filmes elegíveis desta página já foram utilizados ou não atendem aos filtros. Tentando outra página..."
        );
        continue;
      }

      const filmeSorteado =
        filmesElegiveis[
          Math.floor(Math.random() * filmesElegiveis.length)
        ];

      const tituloHigienizado = higienizarTitulo(filmeSorteado.title);
      const chaveTitulo = criarChaveTitulo(filmeSorteado.title);

      console.log(
        `Filme candidato: ${filmeSorteado.title} (${filmeSorteado.id})`
      );

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
        title_brazil: tituloHigienizado,
        studio: estudioNome,
        categories: categoriesLista,

        poster_url: filmeSorteado.poster_path
          ? `https://image.tmdb.org/t/p/w500${filmeSorteado.poster_path}`
          : ''
      };

      const { error } = await supabase
        .from('daily_movies')
        .insert([novoDesafioDiario]);

      if (!error) {
        console.log(
          `Sucesso! Desafio ${novoDesafioDiario.title_brazil} salvo para ${hoje}.`
        );
        return;
      }

      if (error.code === '23505') {
        const desafioCriadoEnquantoExecutava = await buscarDesafioDoDia(hoje);

        if (desafioCriadoEnquantoExecutava) {
          console.log(
            `Já existe um desafio cadastrado para ${hoje}: ${desafioCriadoEnquantoExecutava.title_brazil}. Encerrando sem duplicar a data.`
          );
          return;
        }

        idsJaUsados.add(Number(filmeSorteado.id));
        titulosJaUsados.add(chaveTitulo);

        console.log(
          `O filme ${tituloHigienizado} já existe no banco. Voltando ao sorteio para procurar outro filme...`
        );
        continue;
      }

      throw error;
    }

    throw new Error(
      `Não foi possível encontrar um filme inédito após ${MAX_TENTATIVAS} tentativas.`
    );
  } catch (err) {
    console.error(
      "Falha ao rodar automação do servidor:",
      err.response?.data || err.message
    );

    process.exit(1);
  }
}

rodarAutomacaoDiaria();
