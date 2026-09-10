import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routes from './routes.tsx'
import RoutesEn from './routesEn.tsx'
import Privacy from './Privacy.tsx'
import PrivacyEn from './PrivacyEn.tsx'
import LandingHome from './LandingHome.tsx'
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
const conteudo =
  caminho === '/'
    ? <LandingHome />
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
