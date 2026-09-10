import { useEffect, useState } from 'react'
import './LandingHome.css'

type Idioma = 'pt-br' | 'en-us'

const textos = {
  'pt-br': {
    jogar: 'Jogar',
    comoJogar: 'Como Jogar?',
    fechar: 'Fechar',
    tituloModal: 'Como jogar',
    descricao: 'Adivinhe o filme do dia, letra por letra.',
    regras: [
      'Digite um palpite com a mesma quantidade de letras do título.',
      'As cores mostram se cada letra está no lugar certo, na mesma palavra ou em outra parte do título.',
      'Use as dicas quando precisar e tente descobrir o filme do dia.',
    ],
  },
  'en-us': {
    jogar: 'Play',
    comoJogar: 'How to Play?',
    fechar: 'Close',
    tituloModal: 'How to play',
    descricao: 'Guess the movie of the day, letter by letter.',
    regras: [
      'Enter a guess with the same number of letters as the movie title.',
      'The colors show whether each letter is correct, in the same word, or elsewhere in the title.',
      'Use hints when you need them and try to discover the movie of the day.',
    ],
  },
} as const

export default function LandingHome() {
  const [idioma, setIdioma] = useState<Idioma>('pt-br')
  const [mostrarComoJogar, setMostrarComoJogar] = useState(false)
  const t = textos[idioma]
  const ingles = idioma === 'en-us'

  useEffect(() => {
    document.documentElement.lang = idioma
  }, [idioma])

  const jogar = () => {
    if (ingles) return
    window.location.assign('/pt-br')
  }

  return (
    <main className="landing-home">
      <section className="landing-home__card" aria-labelledby="landing-title">
        <div className="landing-home__brand" id="landing-title">
          <span className="landing-home__icon" aria-hidden="true">🎬</span>
          <h1>Letreiro</h1>
        </div>

        <p className="landing-home__tagline">{t.descricao}</p>

        <div className="landing-home__language" role="group" aria-label="Language / Idioma">
          <button
            type="button"
            className={idioma === 'pt-br' ? 'is-active' : ''}
            onClick={() => setIdioma('pt-br')}
            aria-pressed={idioma === 'pt-br'}
          >
            PT-BR
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            className={idioma === 'en-us' ? 'is-active' : ''}
            onClick={() => setIdioma('en-us')}
            aria-pressed={idioma === 'en-us'}
          >
            EN-US
          </button>
        </div>

        <div className="landing-home__actions">
          <button
            type="button"
            className="landing-home__play"
            onClick={jogar}
            disabled={ingles}
            aria-describedby={ingles ? 'landing-english-status' : undefined}
          >
            {t.jogar}
          </button>
          <button
            type="button"
            className="landing-home__how"
            onClick={() => setMostrarComoJogar(true)}
          >
            {t.comoJogar}
          </button>
        </div>

        {ingles && (
          <p className="landing-home__status" id="landing-english-status">
            English version coming next.
          </p>
        )}
      </section>

      {mostrarComoJogar && (
        <div className="landing-home__overlay" role="presentation" onMouseDown={() => setMostrarComoJogar(false)}>
          <section
            className="landing-home__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-how-title"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <h2 id="landing-how-title">{t.tituloModal}</h2>
            <ol>
              {t.regras.map((regra) => <li key={regra}>{regra}</li>)}
            </ol>
            <button type="button" onClick={() => setMostrarComoJogar(false)}>{t.fechar}</button>
          </section>
        </div>
      )}
    </main>
  )
}
