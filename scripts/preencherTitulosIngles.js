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

async function buscarRegistrosPendentes() {
  const { data, error } = await supabase
    .from('daily_movies')
    .select('release_date, tmdb_id, title_brazil, title_english')
    .is('title_english', null)
    .order('release_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function buscarTituloIngles(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?language=en-US`;
  const resposta = await axios.get(url, configuracaoAxios);
  return higienizarTitulo(resposta.data?.title || resposta.data?.original_title || '');
}

async function atualizarTituloIngles(registro, titleEnglish) {
  const { error } = await supabase
    .from('daily_movies')
    .update({ title_english: titleEnglish })
    .eq('release_date', registro.release_date)
    .eq('tmdb_id', registro.tmdb_id);

  if (error) throw error;
}

async function executar() {
  console.log('Iniciando preenchimento retroativo de title_english...');

  const registros = await buscarRegistrosPendentes();

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

      const titleEnglish = await buscarTituloIngles(registro.tmdb_id);

      if (!titleEnglish) {
        throw new Error('TMDB não retornou um título inglês válido.');
      }

      await atualizarTituloIngles(registro, titleEnglish);
      atualizados += 1;

      console.log(
        `OK ${registro.release_date}: ${registro.title_brazil} -> ${titleEnglish}`,
      );
    } catch (erro) {
      const mensagem = erro.response?.data?.status_message || erro.message || String(erro);
      falhas.push({
        release_date: registro.release_date,
        tmdb_id: registro.tmdb_id,
        erro: mensagem,
      });
      console.error(
        `FALHA ${registro.release_date} (${registro.tmdb_id}): ${mensagem}`,
      );
    }
  }

  console.log(`Concluído: ${atualizados}/${registros.length} registro(s) atualizado(s).`);

  if (falhas.length > 0) {
    console.error(`${falhas.length} registro(s) falharam:`);
    for (const falha of falhas) {
      console.error(
        `- ${falha.release_date} | tmdb_id=${falha.tmdb_id} | ${falha.erro}`,
      );
    }
    process.exit(1);
  }
}

executar().catch((erro) => {
  console.error(
    'Falha ao preencher títulos em inglês:',
    erro.response?.data || erro.message || erro,
  );
  process.exit(1);
});
