import { useState, useEffect, useRef } from 'react';

const prepararTituloParaJogo = (titulo: string): string => {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-ZÀ-Ú ]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

interface FilmeTMDB {
  id: number;
  title: string;
  poster_path?: string | null;
  genre_ids?: number[];
  [key: string]: unknown;
}

interface GeneroTMDB {
  id: number;
  name: string;
}

interface EstudioTMDB {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

interface DetalhesFilmeTMDB {
  id: number;
  title: string;
  poster_path?: string | null;
  genres?: GeneroTMDB[];
  production_companies?: EstudioTMDB[];
}

export interface InfoFilmeExtra {
  genero: string;
  estudio: string;
  posterUrl: string | null;
}

export interface UseFilmeTMDBReturn {
  filmeDoDia: string;
  carregandoFilme: boolean;
  infoFilme: InfoFilmeExtra;
}

const INFO_VAZIA: InfoFilmeExtra = {
  genero: "Desconhecido",
  estudio: "Desconhecido",
  posterUrl: null,
};

const FILMES_LOCAIS: { titulo: string; genero: string; estudio: string; posterUrl: string | null }[] = [
  { titulo: "O PODEROSO CHEFAO", genero: "Crime", estudio: "Paramount Pictures", posterUrl: null },
  { titulo: "MATRIX", genero: "Ficção científica", estudio: "Warner Bros.", posterUrl: null },
  { titulo: "REI LEAO", genero: "Animação", estudio: "Walt Disney Pictures", posterUrl: null },
  { titulo: "TITANIC", genero: "Drama", estudio: "Paramount Pictures", posterUrl: null },
  { titulo: "AVATAR", genero: "Ficção científica", estudio: "20th Century Fox", posterUrl: null },
];

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export function useFilmeTMDB(): UseFilmeTMDBReturn {
  const [filmeDoDia, setFilmeDoDia] = useState("");
  const [carregandoFilme, setCarregandoFilme] = useState(true);
  const [infoFilme, setInfoFilme] = useState<InfoFilmeExtra>(INFO_VAZIA);
  const chamadaEfetuada = useRef(false);

  useEffect(() => {
    if (chamadaEfetuada.current) return;
    chamadaEfetuada.current = true;

    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
      "Content-Type": "application/json",
    };

    const buscarDetalhes = async (id: number): Promise<InfoFilmeExtra> => {
      try {
        const url = `https://api.themoviedb.org/3/movie/${id}?language=pt-BR`;
        const res = await fetch(url, { method: "GET", headers });
        if (!res.ok) throw new Error(String(res.status));
        const detalhes = (await res.json()) as DetalhesFilmeTMDB;

        const genero =
          detalhes.genres && detalhes.genres.length > 0
            ? detalhes.genres.map((g) => g.name).join(", ")
            : "Desconhecido";

        const estudio =
          detalhes.production_companies && detalhes.production_companies.length > 0
            ? detalhes.production_companies[0].name
            : "Desconhecido";

        const posterUrl = detalhes.poster_path
          ? `${POSTER_BASE}${detalhes.poster_path}`
          : null;

        return { genero, estudio, posterUrl };
      } catch {
        return INFO_VAZIA;
      }
    };

    const buscarFilmePopularAleatorio = async () => {
      try {
        const numeroDaPagina = Math.floor(Math.random() * 50) + 1;
        const url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=pt-BR&sort_by=popularity.desc&vote_average.gte=6&vote_count.gte=800&primary_release_date.lte=2026-06-30&page=${numeroDaPagina}`;

        const resposta = await fetch(url, { method: "GET", headers });

        if (!resposta.ok) {
          throw new Error(String(resposta.status));
        }

        const dados = (await resposta.json()) as { results?: FilmeTMDB[] };

        if (dados.results && dados.results.length > 0) {
          const filmesValidos = dados.results
            .map((filme) => ({
              ...filme,
              tituloParaJogo: filme.title,
            }))
            .filter((filme) => {
              const titulo = prepararTituloParaJogo(filme.tituloParaJogo);
              return titulo.length > 2;
            });

          if (filmesValidos.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * filmesValidos.length);
            const escolhido = filmesValidos[indiceAleatorio];
            const tituloJogo = prepararTituloParaJogo(escolhido.tituloParaJogo);

            const info = await buscarDetalhes(escolhido.id);

            console.log(tituloJogo, info);
            setFilmeDoDia(tituloJogo);
            setInfoFilme(info);
            return;
          }
        }

        throw new Error("Nenhum filme passou no filtro");
      } catch (erro: unknown) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        console.warn("Aviso: Conexão TMDB falhou. Usando filme local.", mensagem);
        const local = FILMES_LOCAIS[Math.floor(Math.random() * FILMES_LOCAIS.length)];
        setFilmeDoDia(local.titulo);
        setInfoFilme({
          genero: local.genero,
          estudio: local.estudio,
          posterUrl: local.posterUrl,
        });
      } finally {
        setCarregandoFilme(false);
      }
    };

    buscarFilmePopularAleatorio();
  }, []);

  return { filmeDoDia, carregandoFilme, infoFilme };
}
