import { useState, useEffect, useRef } from 'react'
import { useMovimentacao } from './useMovimentacao'
import { useDicionario } from './useDicionario'
import { useFilmeTMDB } from './useFilmeTMDB'
import type { LetrasDigitadas, EstruturaPalavra } from './useMovimentacao'
import './App.css'

type CorLetra = 'verde' | 'amarelo' | 'roxo' | 'cinza';
type Tema = 'dark' | 'light';
type TipoDica = 'estudio' | 'genero' | 'capa';

interface ResultadoLetra {
  letra: string;
  cor: CorLetra;
}

type Tentativa = Record<number, ResultadoLetra>;
type StatusTeclado = Record<string, CorLetra>;

interface DicasAbertas {
  estudio: boolean;
  genero: boolean;
  capa: boolean;
}

function obterTemaInicial(): Tema {
  if (typeof window === 'undefined') return 'dark';
  const salvo = localStorage.getItem('letreiro-tema');
  if (salvo === 'light' || salvo === 'dark') return salvo;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  // ==========================================
  // ESTADOS PRINCIPAIS DO JOGO
  // ==========================================
  const { filmeDoDia, carregandoFilme, infoFilme } = useFilmeTMDB();
  const [statusTeclado, setStatusTeclado] = useState<StatusTeclado>({});
  const [tentativasAnteriores, setTentativasAnteriores] = useState<Tentativa[]>([]);
  const [jogoGanhou, setJogoGanhou] = useState(false);
  const [mostrarModalVitoria, setMostrarModalVitoria] = useState(false);
  const [tituloVitoria, setTituloVitoria] = useState("Espetacular!");
  const [tema, setTema] = useState<Tema>(obterTemaInicial);

  // Dicas
  const [menuDicasAberto, setMenuDicasAberto] = useState(false);
  const [dicasAbertas, setDicasAbertas] = useState<DicasAbertas>({
    estudio: false,
    genero: false,
    capa: false,
  });
  const [dicaAtiva, setDicaAtiva] = useState<TipoDica | null>(null);

  const contadorDicas =
    (dicasAbertas.estudio ? 1 : 0) +
    (dicasAbertas.genero ? 1 : 0) +
    (dicasAbertas.capa ? 1 : 0);

  const abrirDica = (tipo: TipoDica) => {
    setDicasAbertas((prev) => {
      if (prev[tipo]) return prev;
      return { ...prev, [tipo]: true };
    });
    setDicaAtiva(tipo);
    setMenuDicasAberto(false);
  };

  /** Título da tela de vitória conforme tentativas e dicas usadas */
  const obterTituloVitoria = (numTentativas: number, numDicas: number): string => {
    if (numTentativas > 10 && numDicas === 3) {
      return "Conseguiu!";
    } else if (numTentativas > 6 && numDicas === 3) {
      return "Foi Muito Bem!";
    } else if (numTentativas > 6 && numDicas <= 2) {
      return "É isso aí!";
    } else if (numTentativas <= 6 && numDicas === 0) {
      return "Parabéns!";
    } else if (numTentativas <= 6 && numDicas > 0) {
      return "Muito Bom!";
    } else {
      // Alterna aleatoriamente só para não ficar repetitivo
      return Math.random() < 0.5 ? "Espetacular!" : "Sensacional!";
    }
  };
  
  const {
    letrasDigitadas,
    setLetrasDigitadas,
    cursorAtual,
    setCursorAtual,
    filmeNormalizado,
    totalCaracteres,
    removerAcentos,
    obterProximoIndiceValido,
    obterIndiceAnteriorValido,
    navegarVerticalmente
  } = useMovimentacao(filmeDoDia);

  const { dicionarioBr, carregandoDicionario } = useDicionario();

  // Aplica o tema no documento e salva a preferência
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('letreiro-tema', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Registro estável para o listener ler os estados em tempo real sem closures congeladas
  const dadosAtuaisRef = useRef<{
    letrasDigitadas: LetrasDigitadas;
    cursorAtual: number;
    dicionarioBr: Set<string>;
    jogoGanhou: boolean;
    filmeNormalizado: string;
  }>({
    letrasDigitadas: {},
    cursorAtual: 0,
    dicionarioBr: new Set(),
    jogoGanhou: false,
    filmeNormalizado: '',
  });

  // Garante que o cursor inicial só seja posicionado uma vez por filme
  const cursorInicializadoRef = useRef(false);
  const filmeAnteriorRef = useRef('');

  useEffect(() => {
    dadosAtuaisRef.current = {
      letrasDigitadas,
      cursorAtual,
      dicionarioBr,
      jogoGanhou,
      filmeNormalizado
    };
  }, [letrasDigitadas, cursorAtual, dicionarioBr, jogoGanhou, filmeNormalizado]);

  // Efeito de Entrada: Cursor inicial (só uma vez) e palavras do filme no dicionário
  useEffect(() => {
    if (!filmeNormalizado || totalCaracteres === 0) return;

    // Novo filme carregado → permite reinicializar o cursor
    if (filmeNormalizado !== filmeAnteriorRef.current) {
      filmeAnteriorRef.current = filmeNormalizado;
      cursorInicializadoRef.current = false;
    }

    if (!cursorInicializadoRef.current) {
      setCursorAtual(obterProximoIndiceValido(-1));
      cursorInicializadoRef.current = true;
    }

    // Adiciona as palavras do filme ao dicionário (cópia, sem mutar o Set do state)
    if (dicionarioBr && dicionarioBr.size > 0) {
      const palavrasDoFilme = filmeNormalizado.split(" ");
      palavrasDoFilme.forEach(palavra => {
        if (palavra.trim().length > 0) {
          dicionarioBr.add(palavra);
        }
      });
    }
  }, [filmeNormalizado, totalCaracteres, dicionarioBr, setCursorAtual, obterProximoIndiceValido]);

  // Ref sempre atualizado com a função de tecla mais recente (evita closure velha)
  const lidarComTeclaRef = useRef<(tecla: string) => void>(() => {});

  // Ouvinte global do teclado físico — registra uma vez e usa a ref
  useEffect(() => {
    const escutarTecladoFisico = (evento: KeyboardEvent) => {
      if (carregandoDicionario || carregandoFilme) return;

      const t = removerAcentos(evento.key).toUpperCase();

      if (evento.key === "Enter") {
        evento.preventDefault();
        evento.stopPropagation();
        lidarComTeclaRef.current("ENTER");
      } else if (evento.key === "Backspace") {
        evento.preventDefault();
        evento.stopPropagation();
        lidarComTeclaRef.current("BACKSPACE");
      } else if (evento.key === "ArrowLeft") {
        lidarComTeclaRef.current("ARROWLEFT");
      } else if (evento.key === "ArrowRight") {
        lidarComTeclaRef.current("ARROWRIGHT");
      } else if (evento.key === "ArrowUp") {
        lidarComTeclaRef.current("ARROWUP");
      } else if (evento.key === "ArrowDown") {
        lidarComTeclaRef.current("ARROWDOWN");
      } else if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]$/.test(t)) {
        lidarComTeclaRef.current(t);
      }
    };

    window.addEventListener("keydown", escutarTecladoFisico);
    return () => window.removeEventListener("keydown", escutarTecladoFisico);
  }, [carregandoDicionario, carregandoFilme, removerAcentos]);

  const obterEstruturaPalavras = (): EstruturaPalavra[] => {
    if (!filmeDoDia) return [];
    const palavras = filmeDoDia.split(" ");
    let acumulado = 0;
    return palavras.map(p => {
      const inicio = acumulado;
      const fim = acumulado + p.length - 1;
      acumulado += p.length + 1;
      return { inicio, fim, tamanho: p.length };
    });
  };

  const linhasTeclado: string[][] = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
    ["ENTER"]
  ];

  const processarCoresDoPalpite = (letrasAtuais: LetrasDigitadas) => {
    if (jogoGanhou) return;
    
    const coresDestaTentativa: Tentativa = {};
    const novoStatusTeclado: StatusTeclado = { ...statusTeclado };
    const estruturaPalavras = obterEstruturaPalavras();
    const listaPalavrasFilme = filmeNormalizado.split(" ");

    // 1. Estoque Geral Primário de Letras Ocultas (Filme Inteiro)
    const estoqueFilmeTotal: Record<string, number> = {};
    for (const char of filmeNormalizado) {
      if (char !== " ") {
        estoqueFilmeTotal[char] = (estoqueFilmeTotal[char] || 0) + 1;
      }
    }

    // Agrupar os índices numéricos por bloco de palavra de forma limpa
    const indicesPorPalavra: Record<number, number[]> = {};
    for (let idxGlobal = 0; idxGlobal < totalCaracteres; idxGlobal++) {
      if (filmeNormalizado[idxGlobal] === " ") continue;
      
      let palavraIdx = 0;
      for (let j = 0; j < estruturaPalavras.length; j++) {
        if (idxGlobal >= estruturaPalavras[j].inicio && idxGlobal <= estruturaPalavras[j].fim) {
          palavraIdx = j;
          break;
        }
      }
      if (!indicesPorPalavra[palavraIdx]) indicesPorPalavra[palavraIdx] = [];
      indicesPorPalavra[palavraIdx].push(idxGlobal);
    }

    // ==========================================
    // PASSE 1: Mapear Estritamente Todos os VERDES (Posição Correta)
    // ==========================================
    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const indicesGlobaisDaPalavra = indicesPorPalavra[Number(pKey)];
      const palavraAlvo = listaPalavrasFilme[Number(pKey)];
      const inicioBloco = estruturaPalavras[Number(pKey)].inicio;

      indicesGlobaisDaPalavra.forEach((idxGlobal) => {
        const posNaPalavra = idxGlobal - inicioBloco;
        const letraDigitada = letrasAtuais[idxGlobal];

        if (letraDigitada === palavraAlvo[posNaPalavra]) {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: "verde" };
          if (estoqueFilmeTotal[letraDigitada]) estoqueFilmeTotal[letraDigitada]--;
        }
      });
    });

    // ==========================================
    // PASSE 2: Mapear os AMARELOS (Respeitando Estoque da Palavra Local)
    // ==========================================
    const estoquesPalavrasLocais: Record<number, Record<string, number>> = {};
    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const palavraAlvo = listaPalavrasFilme[Number(pKey)];
      const inicioBloco = estruturaPalavras[Number(pKey)].inicio;

      estoquesPalavrasLocais[Number(pKey)] = {};
      for (let i = 0; i < palavraAlvo.length; i++) {
        const idxGlobalCorrespondente = inicioBloco + i;
        if (coresDestaTentativa[idxGlobalCorrespondente]?.cor !== "verde") {
          const char = palavraAlvo[i];
          estoquesPalavrasLocais[Number(pKey)][char] = (estoquesPalavrasLocais[Number(pKey)][char] || 0) + 1;
        }
      }
    });

    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const indicesGlobaisDaPalavra = indicesPorPalavra[Number(pKey)];

      indicesGlobaisDaPalavra.forEach((idxGlobal) => {
        if (coresDestaTentativa[idxGlobal]) return; // Pula se já for Verde

        const letraDigitada = letrasAtuais[idxGlobal];
        const estoqueLocal = estoquesPalavrasLocais[Number(pKey)];

        if (estoqueLocal[letraDigitada] && estoqueLocal[letraDigitada] > 0) {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: "amarelo" };
          estoqueLocal[letraDigitada]--;
          if (estoqueFilmeTotal[letraDigitada]) estoqueFilmeTotal[letraDigitada]--;
        }
      });
    });

    // ==========================================
    // PASSE 3: Mapear os ROXOS (Filme) e CINZAS (Esgotados) nos Excedentes
    // ==========================================
    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const indicesGlobaisDaPalavra = indicesPorPalavra[Number(pKey)];

      indicesGlobaisDaPalavra.forEach((idxGlobal) => {
        if (coresDestaTentativa[idxGlobal]) return; // Pula se já for Verde ou Amarelo

        const letraDigitada = letrasAtuais[idxGlobal];

        if (estoqueFilmeTotal[letraDigitada] && estoqueFilmeTotal[letraDigitada] > 0) {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: "roxo" };
          estoqueFilmeTotal[letraDigitada]--;
        } else {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: "cinza" };
        }
      });
    });

    // Atualizar as cores das teclas do Teclado Virtual/Físico com base na hierarquia
    Object.values(coresDestaTentativa).forEach((resultado) => {
      const { letra, cor } = resultado;
      const corAtualTeclado = novoStatusTeclado[letra];

      if (!corAtualTeclado || 
          (cor === "verde") || 
          (cor === "amarelo" && corAtualTeclado !== "verde") ||
          (cor === "roxo" && corAtualTeclado !== "verde" && corAtualTeclado !== "amarelo")) {
        novoStatusTeclado[letra] = cor;
      }
    });

    setTentativasAnteriores(prev => [...prev, coresDestaTentativa]);
    setStatusTeclado(novoStatusTeclado);

    const ganhou = Object.values(coresDestaTentativa).every(item => item.cor === "verde");
    if (ganhou) {
      // +1 porque a tentativa vencedora ainda está sendo adicionada neste mesmo ciclo
      const totalTentativas = tentativasAnteriores.length + 1;
      setTituloVitoria(obterTituloVitoria(totalTentativas, contadorDicas));
      setJogoGanhou(true);
      setMostrarModalVitoria(true);
      setLetrasDigitadas({});
      setCursorAtual(-1);
    } else {
      setLetrasDigitadas({});
      setCursorAtual(obterProximoIndiceValido(-1));
    }
  };

  const lidarComTecla = (tecla: string) => {
    const { 
      letrasDigitadas: letrasAtuais, 
      cursorAtual: cursorRef, 
      dicionarioBr: dicBr,
      jogoGanhou: jogoFinalizado,
      filmeNormalizado: filmeAlvo
    } = dadosAtuaisRef.current;

    if (carregandoDicionario || jogoFinalizado) return;

    if (tecla === "BACKSPACE") {
      if (letrasAtuais[cursorRef]) {
        setLetrasDigitadas(prev => { const n = { ...prev }; delete n[cursorRef]; return n; });
      } else {
        const anterior = obterIndiceAnteriorValido(cursorRef);
        if (anterior !== cursorRef) {
          setLetrasDigitadas(prev => { const n = { ...prev }; delete n[anterior]; return n; });
          setCursorAtual(anterior);
        }
      }
    } else if (tecla === "ENTER") {
      const todasPreenchidas = [...filmeAlvo].every((char, idx) => char === " " || letrasAtuais[idx]);
      if (!todasPreenchidas) {
        alert("Preencha todo o tabuleiro antes de enviar!");
        return;
      }

      const structurePalavras = obterEstruturaPalavras();
      for (let i = 0; i < structurePalavras.length; i++) {
        const bloco = structurePalavras[i];
        let palavraPalpiteUsuario = "";

        for (let idxGlobal = bloco.inicio; idxGlobal <= bloco.fim; idxGlobal++) {
          palavraPalpiteUsuario += letrasAtuais[idxGlobal] || "";
        }

        if (dicBr && !dicBr.has(palavraPalpiteUsuario)) {
          alert(`A palavra "${palavraPalpiteUsuario}" não existe no dicionário brasileiro!`);
          return;
        }
      }

      processarCoresDoPalpite(letrasAtuais);

    } else if (tecla === "ARROWLEFT") {
      setCursorAtual(prev => obterIndiceAnteriorValido(prev));
    } else if (tecla === "ARROWRIGHT") {
      setCursorAtual(prev => obterProximoIndiceValido(prev));
    } else if (tecla === "ARROWUP") {
      setCursorAtual(navegarVerticalmente("CIMA"));
    } else if (tecla === "ARROWDOWN") {
      setCursorAtual(navegarVerticalmente("BAIXO"));
    } else if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]$/.test(tecla)) {
      setLetrasDigitadas(prev => ({ ...prev, [cursorRef]: removerAcentos(tecla) }));
      setCursorAtual(prev => obterProximoIndiceValido(prev));
    }
  };

  // Mantém a ref sempre com a versão mais recente da função
  lidarComTeclaRef.current = lidarComTecla;

  const renderizarPalavrasDoFilme = (dadosLetras: LetrasDigitadas | Tentativa, modoHistorico = false) => {
    if (!filmeDoDia) return null;
    let indiceGlobalAcumulado = 0;

    return filmeDoDia.split(" ").map((palavra, indexPalavra) => {
      const blocoPalavra = (
        <div key={indexPalavra} className="palavra-bloco">
          {palavra.split("").map((_letra, indexLetra) => {
            const idxGlobal = indiceGlobalAcumulado;
            indiceGlobalAcumulado++;

            let letraExibida = "";
            let classeCorQuadrado = "";
            if (modoHistorico) {
              const dado = (dadosLetras as Tentativa)[idxGlobal];
              letraExibida = dado?.letra || "";
              classeCorQuadrado = dado?.cor || "";
            } else {
              letraExibida = (dadosLetras as LetrasDigitadas)[idxGlobal] || "";
            }
            const ehOCursorAtual = !modoHistorico && idxGlobal === cursorAtual;

            return (
              <div 
                key={indexLetra} 
                onClick={() => !modoHistorico && setCursorAtual(idxGlobal)}
                className={`letra-quadrado ${ehOCursorAtual ? 'cursor-ativo' : ''} ${classeCorQuadrado}`}
              >
                {letraExibida}
              </div>
            );
          })}
        </div>
      );

      indiceGlobalAcumulado++; 
      return blocoPalavra;
    });
  };

  if (carregandoFilme || !filmeDoDia) {
    return (
      <div className="jogo-container" style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <h2>🎬 Letreiro</h2>
        <p style={{color: 'var(--lt-texto-suave)'}}>Buscando filme do dia na API do TMDB...</p>
      </div>
    );
  }

  return (
    <>
      {jogoGanhou && mostrarModalVitoria && (
        <div
          className="modal-overlay"
          onClick={() => setMostrarModalVitoria(false)}
          role="presentation"
        >
          <div
            className="modal-conteudo modal-conteudo-vitoria"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-vitoria"
          >
            <div className="modal-trofeu">
              <span className="modal-trofeu-icone">🏆</span>
              <span className="modal-trofeu-filme">🎬</span>
            </div>

            {infoFilme.posterUrl && (
              <div className="modal-poster-limpo">
                <img
                  src={infoFilme.posterUrl}
                  alt="Capa do filme"
                  className="modal-poster-img"
                />
              </div>
            )}

            <h2 id="titulo-vitoria" className="modal-titulo-vitoria">{tituloVitoria}</h2>
            <p className="modal-texto-vitoria">
              Você acertou o filme em{' '}
              <strong className="modal-destaque">
                {tentativasAnteriores.length}
              </strong>{' '}
              {tentativasAnteriores.length === 1 ? 'tentativa' : 'tentativas'}
              {contadorDicas > 0 ? (
                <>
                  {' '}e usou{' '}
                  <strong className="modal-destaque-dica">{contadorDicas}</strong>{' '}
                  {contadorDicas === 1 ? 'dica' : 'dicas'}
                </>
              ) : (
                <> sem usar dicas</>
              )}
              !
            </p>
            <div className="modal-rodape">
              <p>Obrigado por jogar o Letreiro!🎬</p>
            </div>
            <button
              type="button"
              className="btn-fechar-vitoria"
              onClick={() => setMostrarModalVitoria(false)}
            >
              Ver tentativas
            </button>
          </div>
        </div>
      )}

      <div className="jogo-container">
        <header className="site-header">
          <button
            type="button"
            className="btn-header btn-dicas"
            onClick={() => setMenuDicasAberto((v) => !v)}
            title="Abrir dicas"
            aria-label="Abrir menu de dicas"
            aria-expanded={menuDicasAberto}
          >
            💡
            {contadorDicas > 0 && (
              <span className="btn-dicas-badge">{contadorDicas}</span>
            )}
          </button>

          <div className="site-header-titulo">
            <span className="site-header-emoji">🎬</span>
            <h1>Letreiro</h1>
          </div>

          <button
            type="button"
            className="btn-header btn-tema"
            onClick={alternarTema}
            title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {tema === 'dark' ? '☀️' : '🌙'}
          </button>

          {menuDicasAberto && (
            <div className="menu-dicas" role="menu">
              <p className="menu-dicas-titulo">Escolha uma dica</p>
              <button
                type="button"
                className={`menu-dicas-item ${dicasAbertas.estudio ? 'ja-usada' : ''}`}
                onClick={() => abrirDica('estudio')}
                role="menuitem"
              >
                <span className="menu-dicas-nivel">Leve</span>
                <span className="menu-dicas-desc">
                  {dicasAbertas.estudio ? infoFilme.estudio : 'Estúdio'}
                </span>
              </button>
              <button
                type="button"
                className={`menu-dicas-item ${dicasAbertas.genero ? 'ja-usada' : ''}`}
                onClick={() => abrirDica('genero')}
                role="menuitem"
              >
                <span className="menu-dicas-nivel">Média</span>
                <span className="menu-dicas-desc">
                  {dicasAbertas.genero ? infoFilme.genero : 'Gênero'}
                </span>
              </button>
              <button
                type="button"
                className={`menu-dicas-item ${dicasAbertas.capa ? 'ja-usada' : ''}`}
                onClick={() => abrirDica('capa')}
                role="menuitem"
                disabled={!infoFilme.posterUrl}
              >
                <span className="menu-dicas-nivel">Forte</span>
                <span className="menu-dicas-desc">
                  {dicasAbertas.capa ? 'Capa (com blur)' : 'Poster'}
                </span>
              </button>
              <button
                type="button"
                className="menu-dicas-fechar"
                onClick={() => setMenuDicasAberto(false)}
              >
                Fechar
              </button>
            </div>
          )}
        </header>

        {/* Painel da dica ativa (texto ou capa borrada) */}
        {dicaAtiva && !jogoGanhou && (
          <div className={`painel-dica painel-dica-${dicaAtiva}`}>
            {dicaAtiva === 'estudio' && (
              <>
                <span className="painel-dica-label">Dica leve — Estúdio</span>
                <span className="painel-dica-valor">{infoFilme.estudio}</span>
              </>
            )}
            {dicaAtiva === 'genero' && (
              <>
                <span className="painel-dica-label">Dica média — Categoria</span>
                <span className="painel-dica-valor">{infoFilme.genero}</span>
              </>
            )}
            {dicaAtiva === 'capa' && infoFilme.posterUrl && (
              <>
                <span className="painel-dica-label">Dica forte — Capa</span>
                <div className="poster-blur-card">
                  <img
                    src={infoFilme.posterUrl}
                    alt="Capa do filme com blur"
                    className="poster-blur-img"
                  />
                </div>
              </>
            )}
            <button
              type="button"
              className="painel-dica-ocultar"
              onClick={() => setDicaAtiva(null)}
              title="Ocultar dica"
            >
              ✕
            </button>
          </div>
        )}

        <main className="tabuleiro">
          <div className={`filme-container palpite-atual-fixado${jogoGanhou ? ' palpite-vitoria' : ''}`}>
            {jogoGanhou ? (
              <button
                type="button"
                className="btn-trofeu-palpite"
                onClick={() => setMostrarModalVitoria(true)}
                title="Ver tela de vitória"
                aria-label="Reabrir tela de vitória"
              >
                <span className="btn-trofeu-icone">🏆</span>
                <span className="btn-trofeu-texto">Vitória — Volte amanhã para outro filme!🎬</span>
              </button>
            ) : (
              renderizarPalavrasDoFilme(letrasDigitadas, false)
            )}
          </div>
          
          <div className="historico-container">
            {[...tentativasAnteriores].reverse().map((tentativa, idxTentativa) => (
              <div key={idxTentativa} className="filme-container historico-linha-bloco">
                {renderizarPalavrasDoFilme(tentativa, true)}
              </div>
            ))}
          </div>
        </main>

        <footer className="teclado-container teclado-fixado-bottom">
          {linhasTeclado.map((linha, indexLinha) => (
            <div key={indexLinha} className="teclado-linha">
              {linha.map((tecla) => (
                <button
                  key={tecla}
                  disabled={carregandoDicionario}
                  className={`tecla ${statusTeclado[tecla] || ""} ${tecla === 'ENTER' ? 'tecla-enter' : ''} ${tecla === 'BACKSPACE' ? 'tecla-backspace' : ''}`}
                  onClick={() => lidarComTecla(tecla)}
                >
                  {tecla === "BACKSPACE" ? "⌫" : tecla}
                </button>
              ))}
            </div>
          ))}
        </footer>
      </div>
    </>
  );
}

export default App;
