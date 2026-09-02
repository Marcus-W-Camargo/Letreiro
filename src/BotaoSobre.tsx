import { useEffect, useId, useRef, useState } from 'react'
import './BotaoSobre.css'

const URL_PORTFOLIO = 'https://marcuscamargo-portfolio.mcpt.workers.dev/'

export default function BotaoSobre({ aoAbrir }: { aoAbrir?: () => void }) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const balaoId = useId()

  useEffect(() => {
    if (!aberto) return

    const fecharAoSair = (evento: Event) => {
      if (evento.target instanceof Node && !containerRef.current?.contains(evento.target)) {
        setAberto(false)
      }
    }
    const fecharComEscape = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      evento.preventDefault()
      setAberto(false)
      botaoRef.current?.focus()
    }

    document.addEventListener('pointerdown', fecharAoSair)
    document.addEventListener('focusin', fecharAoSair)
    document.addEventListener('keydown', fecharComEscape)
    return () => {
      document.removeEventListener('pointerdown', fecharAoSair)
      document.removeEventListener('focusin', fecharAoSair)
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [aberto])

  const alternarBalao = () => {
    if (!aberto) aoAbrir?.()
    setAberto((atual) => !atual)
  }

  return (
    <div className="sobre-container" ref={containerRef}>
      <button
        ref={botaoRef}
        type="button"
        className="btn-header btn-sobre botao-tooltip"
        data-tooltip="Sobre"
        aria-label="Sobre Marcus Camargo"
        aria-expanded={aberto}
        aria-controls={balaoId}
        onClick={alternarBalao}
      >
        <span aria-hidden="true">💡</span>
      </button>
      {aberto && (
        <aside id={balaoId} className="sobre-balao" aria-label="Sobre Marcus Camargo">
          <button
            type="button"
            className="sobre-fechar"
            aria-label="Fechar sobre"
            onClick={() => {
              setAberto(false)
              botaoRef.current?.focus()
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
          <p>Quer conhecer mais sobre mim e meus projetos?</p>
          <p className="sobre-acesso">
            Acesse:
            <a href={URL_PORTFOLIO} target="_blank" rel="noopener noreferrer">Marcus Camargo | Portifólio</a>
          </p>
        </aside>
      )}
    </div>
  )
}
