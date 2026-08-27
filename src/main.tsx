import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routes from './routes.tsx'
import './GameRoutes.css'

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

createRoot(rootElement).render(
  <StrictMode>
    <Routes />
  </StrictMode>,
)