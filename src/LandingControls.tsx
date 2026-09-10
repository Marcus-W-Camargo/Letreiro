import { useEffect, useState } from 'react'
import BotaoSobre from './BotaoSobre'
import BotaoSobreEn from './BotaoSobreEn'
import './LandingControls.css'

type Tema = 'dark' | 'light'
type Idioma = 'pt-br' | 'en-us'

function obterTemaInicial(): Tema {
  const salvo = localStorage.getItem('letreiro-tema')
  if (salvo === 'light' || salvo === 'dark') return salvo
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function obterIdiomaAtual(): Idioma {
  return document.documentElement.lang.toLowerCase() === 'en-us' ? 'en-us' : 'pt-br'
}

export default function LandingControls() {
  const [tema, setTema] = useState<Tema>(obterTemaInicial)
  const [idioma, setIdioma] = useState<Idioma>(obterIdiomaAtual)

  useEffect(() => {
    const observer = new MutationObserver(() => setIdioma(obterIdiomaAtual()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    localStorage.setItem('letreiro-tema', tema)
  }, [tema])

  const alternarTema = () => {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))
  }

  const tooltipTema = idioma === 'pt-br' ? 'Alternar Tema' : 'Switch Theme'
  const ariaTema = idioma === 'pt-br'
    ? tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'
    : tema === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <div className="landing-controls" aria-label={idioma === 'pt-br' ? 'Controles da página' : 'Page controls'}>
      <div className="landing-controls__left">
        {idioma === 'pt-br' ? <BotaoSobre /> : <BotaoSobreEn />}
      </div>

      <div className="landing-controls__right">
        <button
          type="button"
          className="btn-header btn-tema botao-tooltip botao-tooltip-direita"
          onClick={alternarTema}
          data-tooltip={tooltipTema}
          aria-label={ariaTema}
        >
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  )
}
