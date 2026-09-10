import { useEffect, useRef, useState } from 'react'
import { useMovimentacao } from './useMovimentacao'
import { useDicionarioEn } from './useDicionarioEn'
import { supabase } from './supabaseClient'
import { chaveData } from './dateUtils'
import BotaoSobreEn from './BotaoSobreEn'
import type { LetrasDigitadas, EstruturaPalavra } from './useMovimentacao'
import './App.css'

type CorLetra = 'verde' | 'amarelo' | 'roxo' | 'cinza'
type Tema = 'dark' | 'light'
type TipoDica = 'estudio' | 'genero' | 'capa'

interface ResultadoLetra {
  letra: string
  cor: CorLetra
}

type Tentativa = Record<number, ResultadoLetra>
type StatusTeclado = Record<string, CorLetra>

interface DicasAbertas {
  estudio: boolean
  genero: boolean
  capa: boolean
}

interface InfoFilmeSupabase {
  estudio: string
  genero: string
  posterUrl: string
}

interface AppEnProps {
  dataDesafio: Date
  onDesafioAusente?: () => void
}

interface ProgressoJogo {
  status?: 'incompleto' | 'concluido'
  letrasDigitadas?: LetrasDigitadas
  cursorAtual?: number
  statusTeclado?: StatusTeclado
  tentativasAnteriores?: Tentativa[]
  jogoGanhou?: boolean
  dicasAbertas?: DicasAbertas
  dicaAtiva?: TipoDica | null
  tituloVitoria?: string
}

function obterTemaInicial(): Tema {
  if (typeof window === 'undefined') return 'dark'
  const salvo = localStorage.getItem('letreiro-tema')
  if (salvo === 'light' || salvo === 'dark') return salvo
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function formatarDataIngles(data: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(data)
}

export default function AppEn({ dataDesafio, onDesafioAusente }: AppEnProps) {
  const dataDesafioBanco = chaveData(dataDesafio)
  const chaveProgresso = `letreiro-progress-en-${dataDesafioBanco}`
  const textoDataDesafio = formatarDataIngles(dataDesafio)

  const [filmeDoDia, setFilmeDoDia] = useState('')
  const [carregandoFilme, setCarregandoFilme] = useState(true)
  const [infoFilme, setInfoFilme] = useState<InfoFilmeSupabase>({ estudio: '', genero: '', posterUrl: '' })
  const [statusTeclado, setStatusTeclado] = useState<StatusTeclado>({})
  const [tentativasAnteriores, setTentativasAnteriores] = useState<Tentativa[]>([])
  const [jogoGanhou, setJogoGanhou] = useState(false)
  const [mostrarModalVitoria, setMostrarModalVitoria] = useState(false)
  const [tituloVitoria, setTituloVitoria] = useState('Spectacular!')
  const [tema, setTema] = useState<Tema>(obterTemaInicial)
  const [menuDicasAberto, setMenuDicasAberto] = useState(false)
  const [dicasAbertas, setDicasAbertas] = useState<DicasAbertas>({ estudio: false, genero: false, capa: false })
  const [dicaAtiva, setDicaAtiva] = useState<TipoDica | null>(null)

  const contadorDicas =
    (dicasAbertas.estudio ? 1 : 0) +
    (dicasAbertas.genero ? 1 : 0) +
    (dicasAbertas.capa ? 1 : 0)

  const abrirDica = (tipo: TipoDica) => {
    setDicasAbertas((prev) => (prev[tipo] ? prev : { ...prev, [tipo]: true }))
    setDicaAtiva(tipo)
    setMenuDicasAberto(false)
  }

  const obterTituloVitoria = (numTentativas: number, numDicas: number) => {
    if (numTentativas > 10 && numDicas === 3) return 'You got it!'
    if (numTentativas > 6 && numDicas === 3) return 'Very well done!'
    if (numTentativas > 6 && numDicas <= 2) return 'That is it!'
    if (numTentativas <= 6 && numDicas === 0) return 'Congratulations!'
    if (numTentativas <= 6 && numDicas > 0) return 'Great job!'
    return Math.random() < 0.5 ? 'Spectacular!' : 'Amazing!'
  }

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
    navegarVerticalmente,
  } = useMovimentacao(filmeDoDia)

  const { dicionarioEn, carregandoDicionario } = useDicionarioEn()

  const cursorInicializadoRef = useRef(false)
  const filmeAnteriorRef = useRef('')
  const progressoRestauradoRef = useRef(false)
  const ignorarSalvamentoAposRestauroRef = useRef(false)

  useEffect(() => {
    document.documentElement.lang = 'en-US'
  }, [])

  useEffect(() => {
    async function carregarFilmeSalvo() {
      try {
        setCarregandoFilme(true)
        const { data, error } = await supabase
          .from('daily_movies')
          .select('title_english, studio, categories_english, poster_url_english, poster_url')
          .eq('release_date', dataDesafioBanco)
          .maybeSingle()

        if (error) throw error

        if (data?.title_english) {
          setFilmeDoDia(data.title_english)
          setInfoFilme({
            estudio: data.studio || 'Not provided',
            genero: Array.isArray(data.categories_english)
              ? data.categories_english.join(', ')
              : (data.categories_english || 'Not provided'),
            posterUrl: data.poster_url_english || data.poster_url || '',
          })
        } else {
          console.warn(`No English challenge found for date: ${dataDesafioBanco}`)
          onDesafioAusente?.()
        }
      } catch (err) {
        console.error(`Failed to load the English movie for ${dataDesafioBanco}:`, err)
        onDesafioAusente?.()
      } finally {
        setCarregandoFilme(false)
      }
    }

    carregarFilmeSalvo()
  }, [dataDesafioBanco, onDesafioAusente])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('letreiro-tema', tema)
  }, [tema])

  const alternarTema = () => setTema((prev) => (prev === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    if (!filmeDoDia || progressoRestauradoRef.current) return
    progressoRestauradoRef.current = true

    const salvo = localStorage.getItem(chaveProgresso)
    if (!salvo) return

    try {
      const progresso = JSON.parse(salvo) as ProgressoJogo
      ignorarSalvamentoAposRestauroRef.current = true

      if (progresso.letrasDigitadas && typeof progresso.letrasDigitadas === 'object') {
        setLetrasDigitadas(progresso.letrasDigitadas)
      }
      if (progresso.statusTeclado && typeof progresso.statusTeclado === 'object') {
        setStatusTeclado(progresso.statusTeclado)
      }
      if (Array.isArray(progresso.tentativasAnteriores)) {
        setTentativasAnteriores(progresso.tentativasAnteriores)
      }
      if (typeof progresso.jogoGanhou === 'boolean') setJogoGanhou(progresso.jogoGanhou)
      if (progresso.dicasAbertas && typeof progresso.dicasAbertas === 'object') {
        setDicasAbertas({
          estudio: Boolean(progresso.dicasAbertas.estudio),
          genero: Boolean(progresso.dicasAbertas.genero),
          capa: Boolean(progresso.dicasAbertas.capa),
        })
      }
      if (
        progresso.dicaAtiva === null ||
        progresso.dicaAtiva === 'estudio' ||
        progresso.dicaAtiva === 'genero' ||
        progresso.dicaAtiva === 'capa'
      ) {
        setDicaAtiva(progresso.dicaAtiva)
      }
      if (typeof progresso.tituloVitoria === 'string' && progresso.tituloVitoria.trim()) {
        setTituloVitoria(progresso.tituloVitoria)
      }

      if (progresso.jogoGanhou === true) {
        setCursorAtual(-1)
        cursorInicializadoRef.current = true
      } else if (typeof progresso.cursorAtual === 'number') {
        setCursorAtual(progresso.cursorAtual)
        cursorInicializadoRef.current = true
      }
    } catch (erro) {
      console.warn(`Invalid English progress for ${dataDesafioBanco}. Removing local record.`, erro)
      localStorage.removeItem(chaveProgresso)
      ignorarSalvamentoAposRestauroRef.current = false
    }
  }, [filmeDoDia, chaveProgresso, dataDesafioBanco, setLetrasDigitadas, setCursorAtual])

  const dadosAtuaisRef = useRef<{
    letrasDigitadas: LetrasDigitadas
    cursorAtual: number
    dicionarioEn: Set<string>
    jogoGanhou: boolean
    filmeNormalizado: string
  }>({
    letrasDigitadas: {},
    cursorAtual: 0,
    dicionarioEn: new Set(),
    jogoGanhou: false,
    filmeNormalizado: '',
  })

  useEffect(() => {
    dadosAtuaisRef.current = {
      letrasDigitadas,
      cursorAtual,
      dicionarioEn,
      jogoGanhou,
      filmeNormalizado,
    }
  }, [letrasDigitadas, cursorAtual, dicionarioEn, jogoGanhou, filmeNormalizado])

  useEffect(() => {
    if (!filmeNormalizado || totalCaracteres === 0) return

    if (filmeNormalizado !== filmeAnteriorRef.current) filmeAnteriorRef.current = filmeNormalizado

    if (!cursorInicializadoRef.current) {
      setCursorAtual(obterProximoIndiceValido(-1))
      cursorInicializadoRef.current = true
    }

    if (dicionarioEn.size > 0) {
      filmeNormalizado.split(' ').forEach((palavra) => {
        if (palavra.trim()) dicionarioEn.add(palavra)
      })
    }
  }, [filmeNormalizado, totalCaracteres, dicionarioEn, setCursorAtual, obterProximoIndiceValido])

  useEffect(() => {
    if (!filmeDoDia || !progressoRestauradoRef.current) return

    if (ignorarSalvamentoAposRestauroRef.current) {
      ignorarSalvamentoAposRestauroRef.current = false
      return
    }

    const houveInteracao =
      Object.keys(letrasDigitadas).length > 0 ||
      tentativasAnteriores.length > 0 ||
      contadorDicas > 0 ||
      jogoGanhou

    if (!houveInteracao) {
      localStorage.removeItem(chaveProgresso)
      return
    }

    const progresso: ProgressoJogo = {
      status: jogoGanhou ? 'concluido' : 'incompleto',
      letrasDigitadas,
      cursorAtual,
      statusTeclado,
      tentativasAnteriores,
      jogoGanhou,
      dicasAbertas,
      dicaAtiva,
      tituloVitoria,
    }

    localStorage.setItem(chaveProgresso, JSON.stringify(progresso))
  }, [filmeDoDia, chaveProgresso, letrasDigitadas, cursorAtual, statusTeclado, tentativasAnteriores, jogoGanhou, dicasAbertas, dicaAtiva, tituloVitoria, contadorDicas])

  const lidarComTeclaRef = useRef<(tecla: string) => void>(() => {})

  useEffect(() => {
    const escutarTecladoFisico = (evento: KeyboardEvent) => {
      if (carregandoDicionario || carregandoFilme) return
      if (
        evento.defaultPrevented ||
        (evento.target instanceof HTMLElement &&
          evento.target.closest('header, a, input, textarea, select, [contenteditable="true"], [role="dialog"]'))
      ) return

      const t = removerAcentos(evento.key).toUpperCase()

      if (evento.key === 'Enter') {
        evento.preventDefault()
        evento.stopPropagation()
        lidarComTeclaRef.current('ENTER')
      } else if (evento.key === 'Backspace') {
        evento.preventDefault()
        evento.stopPropagation()
        lidarComTeclaRef.current('BACKSPACE')
      } else if (evento.key === 'ArrowLeft') {
        lidarComTeclaRef.current('ARROWLEFT')
      } else if (evento.key === 'ArrowRight') {
        lidarComTeclaRef.current('ARROWRIGHT')
      } else if (evento.key === 'ArrowUp') {
        lidarComTeclaRef.current('ARROWUP')
      } else if (evento.key === 'ArrowDown') {
        lidarComTeclaRef.current('ARROWDOWN')
      } else if (/^[A-Z]$/.test(t)) {
        lidarComTeclaRef.current(t)
      }
    }

    window.addEventListener('keydown', escutarTecladoFisico)
    return () => window.removeEventListener('keydown', escutarTecladoFisico)
  }, [carregandoDicionario, carregandoFilme, removerAcentos])

  const obterEstruturaPalavras = (): EstruturaPalavra[] => {
    if (!filmeDoDia) return []
    const palavras = filmeDoDia.split(' ')
    let acumulado = 0
    return palavras.map((palavra) => {
      const inicio = acumulado
      const fim = acumulado + palavra.length - 1
      acumulado += palavra.length + 1
      return { inicio, fim, tamanho: palavra.length }
    })
  }

  const linhasTeclado = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
    ['ENTER'],
  ]

  const processarCoresDoPalpite = (letrasAtuais: LetrasDigitadas) => {
    if (jogoGanhou) return

    const coresDestaTentativa: Tentativa = {}
    const novoStatusTeclado: StatusTeclado = { ...statusTeclado }
    const estruturaPalavras = obterEstruturaPalavras()
    const listaPalavrasFilme = filmeNormalizado.split(' ')

    const estoqueFilmeTotal: Record<string, number> = {}
    for (const char of filmeNormalizado) {
      if (char !== ' ') estoqueFilmeTotal[char] = (estoqueFilmeTotal[char] || 0) + 1
    }

    const indicesPorPalavra: Record<number, number[]> = {}
    for (let idxGlobal = 0; idxGlobal < totalCaracteres; idxGlobal++) {
      if (filmeNormalizado[idxGlobal] === ' ') continue
      let palavraIdx = 0
      for (let j = 0; j < estruturaPalavras.length; j++) {
        if (idxGlobal >= estruturaPalavras[j].inicio && idxGlobal <= estruturaPalavras[j].fim) {
          palavraIdx = j
          break
        }
      }
      if (!indicesPorPalavra[palavraIdx]) indicesPorPalavra[palavraIdx] = []
      indicesPorPalavra[palavraIdx].push(idxGlobal)
    }

    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const palavraIndex = Number(pKey)
      const indices = indicesPorPalavra[palavraIndex]
      const palavraAlvo = listaPalavrasFilme[palavraIndex]
      const inicioBloco = estruturaPalavras[palavraIndex].inicio

      indices.forEach((idxGlobal) => {
        const posNaPalavra = idxGlobal - inicioBloco
        const letraDigitada = letrasAtuais[idxGlobal]
        if (letraDigitada === palavraAlvo[posNaPalavra]) {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: 'verde' }
          if (estoqueFilmeTotal[letraDigitada]) estoqueFilmeTotal[letraDigitada]--
        }
      })
    })

    const estoquesPalavrasLocais: Record<number, Record<string, number>> = {}
    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const palavraIndex = Number(pKey)
      const palavraAlvo = listaPalavrasFilme[palavraIndex]
      const inicioBloco = estruturaPalavras[palavraIndex].inicio
      estoquesPalavrasLocais[palavraIndex] = {}

      for (let i = 0; i < palavraAlvo.length; i++) {
        const idxGlobal = inicioBloco + i
        if (coresDestaTentativa[idxGlobal]?.cor !== 'verde') {
          const char = palavraAlvo[i]
          estoquesPalavrasLocais[palavraIndex][char] = (estoquesPalavrasLocais[palavraIndex][char] || 0) + 1
        }
      }
    })

    Object.keys(indicesPorPalavra).forEach((pKey) => {
      const palavraIndex = Number(pKey)
      const estoqueLocal = estoquesPalavrasLocais[palavraIndex]
      indicesPorPalavra[palavraIndex].forEach((idxGlobal) => {
        if (coresDestaTentativa[idxGlobal]) return
        const letraDigitada = letrasAtuais[idxGlobal]
        if (estoqueLocal[letraDigitada] && estoqueLocal[letraDigitada] > 0) {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: 'amarelo' }
          estoqueLocal[letraDigitada]--
          if (estoqueFilmeTotal[letraDigitada]) estoqueFilmeTotal[letraDigitada]--
        }
      })
    })

    Object.keys(indicesPorPalavra).forEach((pKey) => {
      indicesPorPalavra[Number(pKey)].forEach((idxGlobal) => {
        if (coresDestaTentativa[idxGlobal]) return
        const letraDigitada = letrasAtuais[idxGlobal]
        if (estoqueFilmeTotal[letraDigitada] && estoqueFilmeTotal[letraDigitada] > 0) {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: 'roxo' }
          estoqueFilmeTotal[letraDigitada]--
        } else {
          coresDestaTentativa[idxGlobal] = { letra: letraDigitada, cor: 'cinza' }
        }
      })
    })

    Object.values(coresDestaTentativa).forEach(({ letra, cor }) => {
      const atual = novoStatusTeclado[letra]
      if (
        !atual ||
        cor === 'verde' ||
        (cor === 'amarelo' && atual !== 'verde') ||
        (cor === 'roxo' && atual !== 'verde' && atual !== 'amarelo')
      ) {
        novoStatusTeclado[letra] = cor
      }
    })

    setTentativasAnteriores((prev) => [...prev, coresDestaTentativa])
    setStatusTeclado(novoStatusTeclado)

    const ganhou = Object.values(coresDestaTentativa).every((item) => item.cor === 'verde')
    if (ganhou) {
      const totalTentativas = tentativasAnteriores.length + 1
      setTituloVitoria(obterTituloVitoria(totalTentativas, contadorDicas))
      setJogoGanhou(true)
      setMostrarModalVitoria(true)
      setLetrasDigitadas({})
      setCursorAtual(-1)
    } else {
      setLetrasDigitadas({})
      setCursorAtual(obterProximoIndiceValido(-1))
    }
  }

  const lidarComTecla = (tecla: string) => {
    const {
      letrasDigitadas: letrasAtuais,
      cursorAtual: cursorRef,
      dicionarioEn: dicEn,
      jogoGanhou: jogoFinalizado,
      filmeNormalizado: filmeAlvo,
    } = dadosAtuaisRef.current

    if (carregandoDicionario || jogoFinalizado) return

    if (tecla === 'BACKSPACE') {
      if (letrasAtuais[cursorRef]) {
        setLetrasDigitadas((prev) => {
          const novo = { ...prev }
          delete novo[cursorRef]
          return novo
        })
      } else {
        const anterior = obterIndiceAnteriorValido(cursorRef)
        if (anterior !== cursorRef) {
          setLetrasDigitadas((prev) => {
            const novo = { ...prev }
            delete novo[anterior]
            return novo
          })
          setCursorAtual(anterior)
        }
      }
      return
    }

    if (tecla === 'ENTER') {
      const todasPreenchidas = [...filmeAlvo].every((char, idx) => char === ' ' || letrasAtuais[idx])
      if (!todasPreenchidas) {
        alert('Fill the entire board before submitting!')
        return
      }

      for (const bloco of obterEstruturaPalavras()) {
        let palavra = ''
        for (let idx = bloco.inicio; idx <= bloco.fim; idx++) palavra += letrasAtuais[idx] || ''
        if (dicEn && !dicEn.has(palavra)) {
          alert(`The word "${palavra}" was not found in the English dictionary!`)
          return
        }
      }

      processarCoresDoPalpite(letrasAtuais)
      return
    }

    if (tecla === 'ARROWLEFT') setCursorAtual((prev) => obterIndiceAnteriorValido(prev))
    else if (tecla === 'ARROWRIGHT') setCursorAtual((prev) => obterProximoIndiceValido(prev))
    else if (tecla === 'ARROWUP') setCursorAtual(navegarVerticalmente('CIMA'))
    else if (tecla === 'ARROWDOWN') setCursorAtual(navegarVerticalmente('BAIXO'))
    else if (/^[A-Z]$/.test(tecla)) {
      setLetrasDigitadas((prev) => ({ ...prev, [cursorRef]: tecla }))
      setCursorAtual((prev) => obterProximoIndiceValido(prev))
    }
  }

  lidarComTeclaRef.current = lidarComTecla

  const renderizarPalavrasDoFilme = (dadosLetras: LetrasDigitadas | Tentativa, modoHistorico = false) => {
    if (!filmeDoDia) return null
    let indiceGlobalAcumulado = 0

    return filmeDoDia.split(' ').map((palavra, indexPalavra) => {
      const blocoPalavra = (
        <div key={indexPalavra} className="palavra-bloco">
          {palavra.split('').map((_letra, indexLetra) => {
            const idxGlobal = indiceGlobalAcumulado++
            let letraExibida = ''
            let classeCorQuadrado = ''

            if (modoHistorico) {
              const dado = (dadosLetras as Tentativa)[idxGlobal]
              letraExibida = dado?.letra || ''
              classeCorQuadrado = dado?.cor || ''
            } else {
              letraExibida = (dadosLetras as LetrasDigitadas)[idxGlobal] || ''
            }

            const ehOCursorAtual = !modoHistorico && idxGlobal === cursorAtual
            return (
              <div
                key={indexLetra}
                onClick={() => !modoHistorico && setCursorAtual(idxGlobal)}
                className={`letra-quadrado ${ehOCursorAtual ? 'cursor-ativo' : ''} ${classeCorQuadrado}`}
              >
                {letraExibida}
              </div>
            )
          })}
        </div>
      )
      indiceGlobalAcumulado++
      return blocoPalavra
    })
  }

  if (carregandoFilme || !filmeDoDia) {
    return (
      <div className="jogo-container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h2>🎬 Letreiro</h2>
        <p style={{ color: 'var(--lt-texto-suave)' }}>Syncing the Letreiro for {textoDataDesafio}...</p>
      </div>
    )
  }

  return (
    <>
      {jogoGanhou && mostrarModalVitoria && (
        <div className="modal-overlay" onClick={() => setMostrarModalVitoria(false)} role="presentation">
          <div className="modal-conteudo modal-conteudo-vitoria" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="titulo-vitoria-en">
            <div className="modal-trofeu">
              <span className="modal-trofeu-icone">🏆</span>
              <span className="modal-trofeu-filme">🎬</span>
            </div>
            {infoFilme.posterUrl && (
              <div className="modal-poster-limpo">
                <img src={infoFilme.posterUrl} alt="Movie poster" className="modal-poster-img" />
              </div>
            )}
            <h2 id="titulo-vitoria-en" className="modal-titulo-vitoria">{tituloVitoria}</h2>
            <p className="modal-texto-vitoria">
              You guessed the movie in <strong className="modal-destaque">{tentativasAnteriores.length}</strong> {tentativasAnteriores.length === 1 ? 'attempt' : 'attempts'}
              {contadorDicas > 0 ? (
                <> and used <strong className="modal-destaque-dica">{contadorDicas}</strong> {contadorDicas === 1 ? 'hint' : 'hints'}</>
              ) : (
                <> without using hints</>
              )}!
            </p>
            <div className="modal-rodape"><p>Thanks for playing Letreiro!🎬</p></div>
            <button type="button" className="btn-fechar-vitoria" onClick={() => setMostrarModalVitoria(false)}>View attempts</button>
          </div>
        </div>
      )}

      <div className="jogo-container">
        <header className="site-header">
          <div className="site-header-acoes">
            <BotaoSobreEn aoAbrir={() => setMenuDicasAberto(false)} />
            <button type="button" className="btn-header btn-calendario botao-tooltip" onClick={() => window.location.assign('/en-us/selectdate')} data-tooltip="All days" aria-label="Open previous Letreiros">
              📅
            </button>
          </div>
          <div className="site-header-titulo"><span className="site-header-emoji">🎬</span><h1>Letreiro</h1></div>
          <div className="site-header-acoes site-header-acoes-direita">
            <button type="button" className="btn-header btn-dicas botao-tooltip" onClick={() => setMenuDicasAberto((v) => !v)} data-tooltip="Hints" aria-label="Open hints menu" aria-expanded={menuDicasAberto} aria-controls="menu-dicas-en">
              <span className="btn-dicas-icone" aria-hidden="true">?</span>
              {contadorDicas > 0 && <span className="btn-dicas-badge">{contadorDicas}</span>}
            </button>
            <button type="button" className="btn-header btn-tema botao-tooltip botao-tooltip-direita" onClick={alternarTema} data-tooltip="Switch theme" aria-label={tema === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {tema === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {menuDicasAberto && (
            <div id="menu-dicas-en" className="menu-dicas" role="menu" aria-label="Game hints">
              <p className="menu-dicas-titulo">Choose a hint</p>
              <button type="button" className={`menu-dicas-item ${dicasAbertas.estudio ? 'ja-usada' : ''}`} onClick={() => abrirDica('estudio')} role="menuitem">
                <span className="menu-dicas-nivel">Light</span><span className="menu-dicas-desc">{dicasAbertas.estudio ? infoFilme.estudio : 'Studio'}</span>
              </button>
              <button type="button" className={`menu-dicas-item ${dicasAbertas.genero ? 'ja-usada' : ''}`} onClick={() => abrirDica('genero')} role="menuitem">
                <span className="menu-dicas-nivel">Medium</span><span className="menu-dicas-desc">{dicasAbertas.genero ? infoFilme.genero : 'Genre'}</span>
              </button>
              <button type="button" className={`menu-dicas-item ${dicasAbertas.capa ? 'ja-usada' : ''}`} onClick={() => abrirDica('capa')} role="menuitem" disabled={!infoFilme.posterUrl}>
                <span className="menu-dicas-nivel">Strong</span><span className="menu-dicas-desc">{dicasAbertas.capa ? 'Poster (blurred)' : 'Poster'}</span>
              </button>
              <button type="button" className="menu-dicas-fechar" onClick={() => setMenuDicasAberto(false)}>Close</button>
            </div>
          )}
        </header>

        <p className="jogo-data-desafio">{textoDataDesafio}</p>

        {dicaAtiva && !jogoGanhou && (
          <div className={`painel-dica painel-dica-${dicaAtiva}`}>
            {dicaAtiva === 'estudio' && (<><span className="painel-dica-label">Light hint — Studio</span><span className="painel-dica-valor">{infoFilme.estudio}</span></>)}
            {dicaAtiva === 'genero' && (<><span className="painel-dica-label">Medium hint — Genre</span><span className="painel-dica-valor">{infoFilme.genero}</span></>)}
            {dicaAtiva === 'capa' && infoFilme.posterUrl && (
              <><span className="painel-dica-label">Strong hint — Poster</span><div className="poster-blur-card"><img src={infoFilme.posterUrl} alt="Blurred movie poster" className="poster-blur-img" /></div></>
            )}
            <button type="button" className="painel-dica-ocultar" onClick={() => setDicaAtiva(null)} aria-label="Hide hint">✕</button>
          </div>
        )}

        <main className="tabuleiro">
          <div className={`filme-container palpite-atual-fixado${jogoGanhou ? ' palpite-vitoria' : ''}`}>
            {jogoGanhou ? (
              <button type="button" className="btn-trofeu-palpite" onClick={() => setMostrarModalVitoria(true)}>
                <span className="btn-trofeu-icone">🏆</span><span className="btn-trofeu-texto">Victory — Choose another Letreiro on the calendar!🎬</span>
              </button>
            ) : renderizarPalavrasDoFilme(letrasDigitadas, false)}
          </div>

          <div className="historico-container">
            {[...tentativasAnteriores].reverse().map((tentativa, idxTentativa) => (
              <div key={idxTentativa} className="filme-container historico-linha-bloco">{renderizarPalavrasDoFilme(tentativa, true)}</div>
            ))}
          </div>
        </main>

        <footer className="teclado-container teclado-fixado-bottom">
          {linhasTeclado.map((linha, indexLinha) => (
            <div key={indexLinha} className="teclado-linha">
              {linha.map((tecla) => (
                <button key={tecla} disabled={carregandoDicionario} className={`tecla ${statusTeclado[tecla] || ''} ${tecla === 'ENTER' ? 'tecla-enter' : ''} ${tecla === 'BACKSPACE' ? 'tecla-backspace' : ''}`} onClick={() => lidarComTecla(tecla)}>
                  {tecla === 'BACKSPACE' ? '⌫' : tecla}
                </button>
              ))}
            </div>
          ))}
        </footer>
      </div>
    </>
  )
}
