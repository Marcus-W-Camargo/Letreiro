import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppEn from './AppEn'
import BotaoSobreEn from './BotaoSobreEn'
import {
  chaveData,
  dataLocalAtual,
  dataParaRota,
  interpretarDataDaRota,
} from './dateUtils'
import './Pages.css'
import './CalendarNavigation.css'

type Tema = 'dark' | 'light'
type StatusDia = 'nao-jogado' | 'incompleto' | 'concluido'

const PREFIXO = '/en-us'
const ROTA_CALENDARIO = `${PREFIXO}/selectdate`
const PRIMEIRO_MES_CALENDARIO = new Date(2026, 7, 1)
const INDICE_PRIMEIRO_MES = PRIMEIRO_MES_CALENDARIO.getFullYear() * 12 + PRIMEIRO_MES_CALENDARIO.getMonth()

function navegar(destino: string) {
  window.location.assign(destino)
}

function indiceDoMes(data: Date) {
  return data.getFullYear() * 12 + data.getMonth()
}

function inicioDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), 1)
}

function useDataLocalAtualizada() {
  const [hoje, setHoje] = useState<Date>(dataLocalAtual)

  useEffect(() => {
    let timeoutId: number | undefined

    const atualizarData = () => {
      const novaData = dataLocalAtual()
      setHoje((dataAnterior) =>
        dataAnterior.getTime() === novaData.getTime() ? dataAnterior : novaData,
      )
    }

    const agendarProximaVirada = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      const agora = new Date()
      const proximaVirada = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate() + 1,
        0,
        0,
        0,
        150,
      )
      const espera = Math.max(250, proximaVirada.getTime() - agora.getTime())
      timeoutId = window.setTimeout(() => {
        atualizarData()
        agendarProximaVirada()
      }, espera)
    }

    const atualizarAoRetornar = () => {
      if (document.visibilityState !== 'visible') return
      atualizarData()
      agendarProximaVirada()
    }

    window.addEventListener('focus', atualizarAoRetornar)
    document.addEventListener('visibilitychange', atualizarAoRetornar)
    agendarProximaVirada()

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      window.removeEventListener('focus', atualizarAoRetornar)
      document.removeEventListener('visibilitychange', atualizarAoRetornar)
    }
  }, [])

  return hoje
}

function obterTemaInicial(): Tema {
  const salvo = localStorage.getItem('letreiro-tema')
  if (salvo === 'light' || salvo === 'dark') return salvo
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function useTemaPagina() {
  const [tema, setTema] = useState<Tema>(obterTemaInicial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('letreiro-tema', tema)
  }, [tema])

  return {
    tema,
    alternarTema: () => setTema((atual) => (atual === 'dark' ? 'light' : 'dark')),
  }
}

function rotaDoDia(data: Date) {
  return `${PREFIXO}/${dataParaRota(data)}`
}

function obterStatusDia(data: Date): StatusDia {
  try {
    const salvo = localStorage.getItem(`letreiro-progress-en-${chaveData(data)}`)
    if (!salvo) return 'nao-jogado'

    const progresso = JSON.parse(salvo) as {
      status?: string
      jogoGanhou?: boolean
      tentativasAnteriores?: unknown[]
    }

    if (progresso.status === 'concluido' || progresso.jogoGanhou === true) return 'concluido'
    if (
      progresso.status === 'incompleto' ||
      (Array.isArray(progresso.tentativasAnteriores) && progresso.tentativasAnteriores.length > 0)
    ) {
      return 'incompleto'
    }
  } catch {
    return 'nao-jogado'
  }

  return 'nao-jogado'
}

function CabecalhoPagina({ mostrarMarca = true }: { mostrarMarca?: boolean }) {
  const { tema, alternarTema } = useTemaPagina()

  return (
    <header className={`pagina-header${mostrarMarca ? '' : ' pagina-header-sem-marca'}`}>
      <BotaoSobreEn />
      {mostrarMarca && (
        <a href="/" className="pagina-marca pagina-marca-link" aria-label="Return to Letreiro language selection">
          <span className="pagina-marca-icone">🎬</span>
          <span className="pagina-marca-nome">Letreiro</span>
        </a>
      )}
      <button
        type="button"
        className="pagina-tema botao-tooltip botao-tooltip-direita"
        onClick={alternarTema}
        data-tooltip="Switch theme"
        aria-label={tema === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {tema === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}

function MarcaDestaque() {
  return (
    <a href="/" className="pagina-marca pagina-marca-destaque pagina-marca-link" aria-label="Return to Letreiro language selection">
      <span className="pagina-marca-icone">🎬</span>
      <span className="pagina-marca-nome">Letreiro</span>
    </a>
  )
}

function PaginaInicial({ hoje }: { hoje: Date }) {
  return (
    <div className="pagina-container pagina-inicial">
      <CabecalhoPagina mostrarMarca={false} />
      <main className="pagina-inicial-conteudo">
        <MarcaDestaque />
        <p className="pagina-apresentacao">Discover today's Letreiro, letter by letter.</p>
        <button type="button" className="btn-letreiro-dia" onClick={() => navegar(rotaDoDia(hoje))}>
          <span aria-hidden="true">🎬</span>
          <span>Today's Letreiro</span>
          <span className="btn-seta" aria-hidden="true" />
        </button>
        <button type="button" className="link-letreiros-anteriores" onClick={() => navegar(ROTA_CALENDARIO)}>
          Previous Letreiros
        </button>
      </main>
    </div>
  )
}

function ClaqueteDia({ data, hoje }: { data: Date; hoje: Date }) {
  const futuro = data.getTime() > hoje.getTime()
  const atual = data.getTime() === hoje.getTime()
  const status = obterStatusDia(data)

  return (
    <button
      type="button"
      className={`claquete-dia status-${status}${atual ? ' dia-atual' : ''}${futuro ? ' dia-futuro' : ''}`}
      onClick={() => !futuro && navegar(rotaDoDia(data))}
      disabled={futuro}
      aria-label={`${data.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${futuro ? ', unavailable' : ''}`}
    >
      <span className="claquete-topo" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="claquete-corpo">
        <span className="claquete-numero">{data.getDate()}</span>
      </span>
    </button>
  )
}

function Calendario({ hoje }: { hoje: Date }) {
  const indiceMesAtual = indiceDoMes(hoje)
  const [mesExibido, setMesExibido] = useState(() => inicioDoMes(hoje))
  const ultimoIndiceMesAtualRef = useRef(indiceMesAtual)

  useEffect(() => {
    const indiceAnterior = ultimoIndiceMesAtualRef.current
    if (indiceAnterior === indiceMesAtual) return

    setMesExibido((mesAnteriormenteExibido) =>
      indiceDoMes(mesAnteriormenteExibido) === indiceAnterior
        ? inicioDoMes(hoje)
        : mesAnteriormenteExibido,
    )
    ultimoIndiceMesAtualRef.current = indiceMesAtual
  }, [hoje, indiceMesAtual])

  const ano = mesExibido.getFullYear()
  const mes = mesExibido.getMonth()
  const indiceMesExibido = indiceDoMes(mesExibido)
  const podeVoltar = indiceMesExibido > INDICE_PRIMEIRO_MES
  const podeAvancar = indiceMesExibido < indiceMesAtual

  const mudarMes = (direcao: -1 | 1) => {
    setMesExibido((mesAtualExibido) => {
      const candidato = new Date(
        mesAtualExibido.getFullYear(),
        mesAtualExibido.getMonth() + direcao,
        1,
      )
      const indiceCandidato = indiceDoMes(candidato)

      if (indiceCandidato < INDICE_PRIMEIRO_MES || indiceCandidato > indiceMesAtual) {
        return mesAtualExibido
      }
      return candidato
    })
  }

  const dias = useMemo(() => {
    const totalDias = new Date(ano, mes + 1, 0).getDate()
    return Array.from({ length: totalDias }, (_, indice) => new Date(ano, mes, indice + 1))
  }, [ano, mes])

  const deslocamento = new Date(ano, mes, 1).getDay()
  const tituloMes = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(ano, mes, 1))

  return (
    <div className="pagina-container pagina-calendario">
      <CabecalhoPagina />
      <main className="calendario-conteudo">
        <div className="calendario-titulos">
          <h1>Previous Letreiros</h1>
          <div className="calendario-mes-navegacao" aria-label="Month navigation">
            <button
              type="button"
              className="calendario-seta"
              onClick={() => mudarMes(-1)}
              disabled={!podeVoltar}
              aria-label="Go to previous month"
              title={podeVoltar ? 'Previous month' : 'No previous month available'}
            >
              &lt;
            </button>
            <p aria-live="polite">{tituloMes}</p>
            <button
              type="button"
              className="calendario-seta"
              onClick={() => mudarMes(1)}
              disabled={!podeAvancar}
              aria-label="Go to next month"
              title={podeAvancar ? 'Next month' : 'No next month available'}
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="calendario-semana" aria-hidden="true">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dia, indice) => (
            <span key={`${dia}-${indice}`}>{dia}</span>
          ))}
        </div>

        <div className="calendario-grade">
          {Array.from({ length: deslocamento }, (_, indice) => (
            <span className="calendario-vazio" key={`empty-${indice}`} />
          ))}
          {dias.map((data) => (
            <ClaqueteDia key={chaveData(data)} data={data} hoje={hoje} />
          ))}
        </div>

        <div className="calendario-legenda" aria-label="Calendar legend">
          <span><i className="legenda-cor legenda-incompleto" />Incomplete</span>
          <span><i className="legenda-cor legenda-concluido" />Completed</span>
        </div>
      </main>
    </div>
  )
}

function LetreiroNaoEncontrado() {
  return (
    <div className="pagina-container pagina-erro">
      <CabecalhoPagina />
      <main className="pagina-erro-conteudo">
        <span className="pagina-erro-icone" aria-hidden="true">🎬</span>
        <h1>Letreiro not found</h1>
        <p>We could not find a challenge for this date.</p>
        <button type="button" className="btn-ir-calendario" onClick={() => navegar(ROTA_CALENDARIO)}>
          Go to Calendar
        </button>
      </main>
    </div>
  )
}

function JogoRota({ data }: { data: Date }) {
  const [desafioAusente, setDesafioAusente] = useState(false)
  const marcarDesafioAusente = useCallback(() => setDesafioAusente(true), [])

  useEffect(() => {
    const marcaJogo = document.querySelector<HTMLElement>('.site-header-titulo')
    if (!marcaJogo) return

    const abrirInicio = () => navegar('/')
    const abrirInicioTeclado = (evento: KeyboardEvent) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault()
        abrirInicio()
      }
    }

    marcaJogo.setAttribute('role', 'link')
    marcaJogo.setAttribute('aria-label', 'Return to Letreiro language selection')
    marcaJogo.tabIndex = 0
    marcaJogo.classList.add('marca-jogo-link')
    marcaJogo.addEventListener('click', abrirInicio)
    marcaJogo.addEventListener('keydown', abrirInicioTeclado)

    return () => {
      marcaJogo.removeEventListener('click', abrirInicio)
      marcaJogo.removeEventListener('keydown', abrirInicioTeclado)
      marcaJogo.classList.remove('marca-jogo-link')
    }
  }, [])

  if (desafioAusente) return <LetreiroNaoEncontrado />
  return <AppEn dataDesafio={data} onDesafioAusente={marcarDesafioAusente} />
}

function normalizarCaminho(caminho: string) {
  if (caminho.length > 1 && caminho.endsWith('/')) return caminho.slice(0, -1)
  return caminho
}

export default function RoutesEn() {
  const hoje = useDataLocalAtualizada()
  const caminho = normalizarCaminho(window.location.pathname.toLowerCase())

  useEffect(() => {
    document.documentElement.lang = 'en-US'
  }, [])

  if (caminho === PREFIXO) return <PaginaInicial hoje={hoje} />
  if (caminho === ROTA_CALENDARIO) return <Calendario hoje={hoje} />

  const prefixoData = `${PREFIXO}/`
  if (caminho.startsWith(prefixoData)) {
    const trechoData = caminho.slice(prefixoData.length)
    const data = interpretarDataDaRota(trechoData)
    if (data && data.getTime() <= hoje.getTime()) return <JogoRota data={data} />
  }

  return <LetreiroNaoEncontrado />
}