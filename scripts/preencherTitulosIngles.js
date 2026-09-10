import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tmdbToken = process.env.TMDB_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !tmdbToken) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e TMDB_API_KEY são obrigatórios.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const configuracaoAxios = {
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${tmdbToken.trim()}`,
  },
};

function higienizarTitulo(str) {
  if (!str) return '';

  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, ' ')
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trim();
}

function montarUrlPoster(filePath) {
  return filePath ? `https://image.tmdb.org/t/p/w500${filePath}` : '';
}

function escolherPosterIngles(posters, posterFallback) {
  if (!Array.isArray(posters) || posters.length === 0) {
    return montarUrlPoster(posterFallback);
  }

  const posterIngles = posters.find((poster) => poster?.iso_639_1 === 'en' && poster?.file_path);
  if (posterIngles) return montarUrlPoster(posterIngles.file_path);

  const posterSemIdioma = posters.find((poster) => poster?.iso_639_1 === null && poster?.file_path);
  if (posterSemIdioma) return montarUrlPoster(posterSemIdioma.file_path);

  return montarUrlPoster(posterFallback || posters.find((poster) => poster?.file_path)?.file_path);
}

async function buscarRegistros() {
  const { data, error } = await supabase
    .from('daily_movies')
    .select('release_date, tmdb_id, title_brazil, title_english, categories_english, poster_url_english')
    .order('release_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function buscarDadosIngles(tmdbId) {
  const [respostaDetalhes, respostaImagens] = await Promise.all([
    axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}?language=en-US`, configuracaoAxios),
    axios.get(
      `https://api.themoviedb.org/3/movie/${tmdbId}/images?include_image_language=en,null`,
      configuracaoAxios,
    ),
  ]);

  const detalhes = respostaDetalhes.data || {};
  const imagens = respostaImagens.data || {};

  const titleEnglish = higienizarTitulo(
    detalhes.title || detalhes.original_title || '',
  );

  const categoriesEnglish = Array.isArray(detalhes.genres) && detalhes.genres.length > 0
    ? detalhes.genres.map((genero) => genero.name).filter(Boolean)
    : ['Cinema'];

  const posterUrlEnglish = escolherPosterIngles(imagens.posters, detalhes.poster_path);

  return { titleEnglish, categoriesEnglish, posterUrlEnglish };
}

async function atualizarRegistro(registro, atualizacoes) {
  const { error } = await supabase
    .from('daily_movies')
    .update(atualizacoes)
    .eq('release_date', registro.release_date)
    .eq('tmdb_id', registro.tmdb_id);

  if (error) throw error;
}

async function executar() {
  console.log('Iniciando preenchimento retroativo dos dados em inglês...');

  const todos = await buscarRegistros();
  const registros = todos.filter((registro) => {
    const semTitulo = !registro.title_english;
    const semCategorias = !Array.isArray(registro.categories_english) || registro.categories_english.length === 0;
    const semPoster = !registro.poster_url_english;
    return semTitulo || semCategorias || semPoster;
  });

  if (registros.length === 0) {
    console.log('Nenhum registro pendente. Nada a fazer.');
    return;
  }

  console.log(`${registros.length} registro(s) pendente(s) encontrado(s).`);

  let atualizados = 0;
  const falhas = [];

  for (const registro of registros) {
    try {
      if (!registro.tmdb_id) {
        throw new Error('Registro sem tmdb_id.');
      }

      const { titleEnglish, categoriesEnglish, posterUrlEnglish } = await buscarDadosIngles(registro.tmdb_id);
      const atualizacoes = {};

      if (!registro.title_english) {
        if (!titleEnglish) {
          throw new Error('TMDB não retornou um título inglês válido.');
        }
        atualizacoes.title_english = titleEnglish;
      }

      if (!Array.isArray(registro.categories_english) || registro.categories_english.length === 0) {
        atualizacoes.categories_english = categoriesEnglish;
      }

      if (!registro.poster_url_english) {
        if (!posterUrlEnglish) {
          throw new Error('TMDB não retornou um pôster válido para a versão em inglês.');
        }
        atualizacoes.poster_url_english = posterUrlEnglish;
      }

      if (Object.keys(atualizacoes).length === 0) {
        continue;
      }

      await atualizarRegistro(registro, atualizacoes);
      atualizados += 1;

      const partes = [];
      if (atualizacoes.title_english) partes.push(`title_english=${atualizacoes.title_english}`);
      if (atualizacoes.categories_english) partes.push(`categories_english=[${atualizacoes.categories_english.join(', ')}]`);
      if (atualizacoes.poster_url_english) partes.push('poster_url_english=OK');

      console.log(`OK ${registro.release_date}: ${partes.join(' | ')}`);
    } catch (erro) {
      const mensagem = erro.response?.data?.status_message || erro.message || String(erro);
      falhas.push({
        release_date: registro.release_date,
        tmdb_id: registro.tmdb_id,
        erro: mensagem,
      });
      console.error(`FALHA ${registro.release_date} (${registro.tmdb_id}): ${mensagem}`);
    }
  }

  console.log(`Concluído: ${atualizados}/${registros.length} registro(s) atualizado(s).`);

  if (falhas.length > 0) {
    console.error(`${falhas.length} registro(s) falharam:`);
    for (const falha of falhas) {
      console.error(`- ${falha.release_date} | tmdb_id=${falha.tmdb_id} | ${falha.erro}`);
    }
    process.exit(1);
  }
}

executar().catch((erro) => {
  console.error(
    'Falha ao preencher dados em inglês:',
    erro.response?.data || erro.message || erro,
  );
  process.exit(1);
});
