import { useCallback, useEffect, useMemo, useState } from 'react'
import App from './App'
import {
  chaveData,
  dataLocalAtual,
  dataParaRota,
  interpretarDataDaRota,
} from './dateUtils'
import './Pages.css'

type Tema = 'dark' | 'light'
type StatusDia = 'nao-jogado' | 'incompleto' | 'concluido'

const PREFIXO = '/pt-br'
const ROTA_CALENDARIO = `${PREFIXO}/selecdata`

function navegar(destino: string) {
  window.location.assign(destino)
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
    const salvo = localStorage.getItem(`letreiro-progresso-${chaveData(data)}`)
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
      {mostrarMarca && (
        <div className="pagina-marca" aria-label="Letreiro">
          <span className="pagina-marca-icone">🎬</span>
          <span className="pagina-marca-nome">Letreiro</span>
        </div>
      )}
      <button
        type="button"
        className="pagina-tema"
        onClick={alternarTema}
        title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        aria-label={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {tema === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}

function MarcaDestaque() {
  return (
    <div className="pagina-marca pagina-marca-destaque" aria-label="Letreiro">
      <span className="pagina-marca-icone">🎬</span>
      <span className="pagina-marca-nome">Letreiro</span>
    </div>
  )
}

function PaginaInicial() {
  const hoje = dataLocalAtual()

  return (
    <div className="pagina-container pagina-inicial">
      <CabecalhoPagina mostrarMarca={false} />
      <main className="pagina-inicial-conteudo">
        <MarcaDestaque />
        <p className="pagina-apresentacao">Descubra o Letreiro do dia, letra por letra.</p>
        <button type="button" className="btn-letreiro-dia" onClick={() => navegar(rotaDoDia(hoje))}>
          <span aria-hidden="true">🎬</span>
          <span>Letreiro do dia</span>
          <span className="btn-seta" aria-hidden="true" />
        </button>
        <button type="button" className="link-letreiros-anteriores" onClick={() => navegar(ROTA_CALENDARIO)}>
          Letreiros anteriores
        </button>
      </main>
    </div>
  )
}

function ClaqueteDia({ data, hoje }: { data: Date; hoje: Date }) {
  const futuro = data.getTime() > hoje.getTime()
  const atual = data.getTime() === hoje.getTime()
  const status = obterStatusDia(data)

  const abrirDia = () => {
    if (!futuro) navegar(rotaDoDia(data))
  }

  return (
    <button
      type="button"
      className={`claquete-dia status-${status}${atual ? ' dia-atual' : ''}${futuro ? ' dia-futuro' : ''}`}
      onClick={abrirDia}
      disabled={futuro}
      aria-label={`${data.getDate()} de ${data.toLocaleDateString('pt-BR', { month: 'long' })}${futuro ? ', indisponível' : ''}`}
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

function Calendario() {
  const hoje = dataLocalAtual()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  const dias = useMemo(() => {
    const totalDias = new Date(ano, mes + 1, 0).getDate()
    return Array.from({ length: totalDias }, (_, indice) => new Date(ano, mes, indice + 1))
  }, [ano, mes])

  const deslocamento = new Date(ano, mes, 1).getDay()
  const tituloMes = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(ano, mes, 1))
  const tituloFormatado = tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1)

  return (
    <div className="pagina-container pagina-calendario">
      <CabecalhoPagina />
      <main className="calendario-conteudo">
        <div className="calendario-titulos">
          <h1>Letreiros anteriores</h1>
          <p>{tituloFormatado}</p>
        </div>

        <div className="calendario-semana" aria-hidden="true">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, indice) => (
            <span key={`${dia}-${indice}`}>{dia}</span>
          ))}
        </div>

        <div className="calendario-grade">
          {Array.from({ length: deslocamento }, (_, indice) => (
            <span className="calendario-vazio" key={`vazio-${indice}`} />
          ))}
          {dias.map((data) => (
            <ClaqueteDia key={chaveData(data)} data={data} hoje={hoje} />
          ))}
        </div>

        <div className="calendario-legenda" aria-label="Legenda do calendário">
          <span><i className="legenda-cor legenda-incompleto" />Incompleto</span>
          <span><i className="legenda-cor legenda-concluido" />Concluído</span>
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
        <h1>Letreiro não encontrado</h1>
        <p>Não encontramos um desafio para esta data.</p>
        <button type="button" className="btn-ir-calendario" onClick={() => navegar(ROTA_CALENDARIO)}>
          Ir para Calendário
        </button>
      </main>
    </div>
  )
}

function JogoRota({ data }: { data: Date }) {
  const [desafioAusente, setDesafioAusente] = useState(false)
  const marcarDesafioAusente = useCallback(() => setDesafioAusente(true), [])

  if (desafioAusente) return <LetreiroNaoEncontrado />

  return <App dataDesafio={data} onDesafioAusente={marcarDesafioAusente} />
}

function normalizarCaminho(caminho: string) {
  if (caminho.length > 1 && caminho.endsWith('/')) return caminho.slice(0, -1)
  return caminho
}

export default function Routes() {
  const caminho = normalizarCaminho(window.location.pathname.toLowerCase())

  if (caminho === '/') {
    window.location.replace(PREFIXO)
    return null
  }

  if (caminho === PREFIXO) return <PaginaInicial />
  if (caminho === ROTA_CALENDARIO) return <Calendario />

  const prefixoData = `${PREFIXO}/`
  if (caminho.startsWith(prefixoData)) {
    const trechoData = caminho.slice(prefixoData.length)
    const data = interpretarDataDaRota(trechoData)
    const hoje = dataLocalAtual()

    if (data && data.getTime() <= hoje.getTime()) {
      return <JogoRota data={data} />
    }
  }

  return <LetreiroNaoEncontrado />
}
