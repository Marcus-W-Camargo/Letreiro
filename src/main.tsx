import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routes from './routes.tsx'
import RoutesEn from './routesEn.tsx'
import Privacy from './Privacy.tsx'
import PrivacyEn from './PrivacyEn.tsx'
import LandingHome from './LandingHome.tsx'
import LandingControls from './LandingControls.tsx'
import SiteFooter from './SiteFooter.tsx'
import './GameRoutes.css'
import './Tooltips.css'

// Aplica o tema salvo antes do React montar (evita flash)
(() => {
  const salvo = localStorage.getItem('letreiro-tema')
  const tema =
    salvo === 'light' || salvo === 'dark'
      ? salvo
      : window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
  document.documentElement.setAttribute('data-theme', tema)
})()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento root não encontrado')
}

const caminho = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'

const definirMeta = (seletor: string, atributo: 'content' | 'href', valor: string) => {
  const elemento = document.querySelector(seletor)
  if (elemento) elemento.setAttribute(atributo, valor)
}

const origem = 'https://letreiro.marcuscamargo-portfolio.com.br'
const ehEn = caminho === '/en-us' || caminho.startsWith('/en-us/')
const ehPrivacidade = caminho === '/pt-br/privacidade' || caminho === '/en-us/privacy'
const urlCanonica = ehPrivacidade
  ? `${origem}${caminho}`
  : ehEn
    ? `${origem}/en-us`
    : caminho === '/'
      ? `${origem}/`
      : `${origem}/pt-br`

const titulo = ehPrivacidade
  ? ehEn
    ? 'Privacy Policy | Letreiro'
    : 'Política de Privacidade | Letreiro'
  : ehEn
    ? 'Letreiro — Daily Movie Puzzle'
    : 'Letreiro — Jogo diário de filmes'

const descricao = ehPrivacidade
  ? ehEn
    ? 'Read the Letreiro privacy policy and learn how the game handles data and privacy.'
    : 'Leia a Política de Privacidade do Letreiro e saiba como o jogo trata dados e privacidade.'
  : ehEn
    ? 'Guess the movie of the day letter by letter, use hints, and come back every day for a new challenge.'
    : 'Adivinhe o filme do dia letra por letra, use pistas e volte todos os dias para um novo desafio.'

document.documentElement.lang = ehEn ? 'en-US' : 'pt-BR'
document.title = titulo
definirMeta('meta[name="description"]', 'content', descricao)
definirMeta('link[rel="canonical"]', 'href', urlCanonica)
definirMeta('meta[property="og:title"]', 'content', titulo)
definirMeta('meta[property="og:description"]', 'content', descricao)
definirMeta('meta[property="og:url"]', 'content', urlCanonica)
definirMeta('meta[property="og:locale"]', 'content', ehEn ? 'en_US' : 'pt_BR')
definirMeta('meta[name="twitter:title"]', 'content', titulo)
definirMeta('meta[name="twitter:description"]', 'content', descricao)

const conteudo =
  caminho === '/'
    ? <><LandingControls /><LandingHome /></>
    : caminho === '/pt-br/privacidade'
      ? <Privacy />
      : caminho === '/en-us/privacy'
        ? <PrivacyEn />
        : caminho === '/en-us' || caminho.startsWith('/en-us/')
          ? <RoutesEn />
          : <Routes />

createRoot(rootElement).render(
  <StrictMode>
    <div className="letreiro-shell">
      {conteudo}
      <SiteFooter />
    </div>
  </StrictMode>,
)
