import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tmdbToken = process.env.TMDB_API_KEY; // Seu Token de Acesso de Leitura da API (Bearer Token)

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

    // Configuração dos cabeçalhos de segurança exigidos pelo TMDB no ambiente de servidor
    const opcoesFetch = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${tmdbToken.trim()}` // Envia o token limpando espaços residuais
      }
    };

    // 1. SORTEIO REAL: Busca uma página aleatória de filmes populares do TMDB
    const paginaAleatoria = Math.floor(Math.random() * 10) + 1; 
    const urlTMDB = `https://themoviedb.org{paginaAleatoria}`;
    
    const respostaTMDB = await fetch(urlTMDB, opcoesFetch);
    
    if (!respostaTMDB.ok) {
      throw new Error(`Erro na API do TMDB: Status ${respostaTMDB.status}`);
    }
    
    const dadosTMDB = await respostaTMDB.json();

    if (!dadosTMDB.results || dadosTMDB.results.length === 0) {
      throw new Error("Nenhum filme foi retornado na resposta do TMDB.");
    }

    // 2. Filtra apenas os filmes que possuem título utilizável (sem números no título)
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
    const urlDetalhes = `https://themoviedb.org{filmeSorteado.id}?language=pt-BR`;
    const respostaDetalhes = await fetch(urlDetalhes, opcoesFetch);
    const detalhes = await respostaDetalhes.json();

    const estudioNome = detalhes.production_companies?.[0]?.name || 'Independente';
    const categoriasLista = detalhes.genres?.map(g => g.name) || ['Cinema'];

    // 4. Estrutura o objeto final idêntico ao esperado pelo Letreiro
    const novoDesafioDiario = {
      release_date: hoje,
      tmdb_id: filmeSorteado.id,
      title_brazil: higienizarTitulo(filmeSorteado.title),
      studio: estudioNome,
      categories: categoriasLista,
      poster_url: filmeSorteado.poster_path ? `https://tmdb.org{filmeSorteado.poster_path}` : ''
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
      console.log(`Sucesso Absoluto! Desafio '${novoDesafioDiario.title_brazil}' salvo para ${hoje}.`);
    }

  } catch (err) {
    console.error("Falha ao rodar automação do servidor:", err.message);
    process.exit(1);
  }
}

rodarAutomacaoDiaria();
