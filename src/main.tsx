import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routes from './routes.tsx'
import Privacy from './Privacy.tsx'
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
const conteudo = caminho === '/pt-br/privacidade' ? <Privacy /> : <Routes />

createRoot(rootElement).render(
  <StrictMode>
    <div className="letreiro-shell">
      {conteudo}
      <SiteFooter />
    </div>
  </StrictMode>,
)
