import { useEffect, useState } from 'react'
import './LandingHome.css'

type Idioma = 'pt-br' | 'en-us'

const textos = {
  'pt-br': {
    jogar: 'Jogar',
    comoJogar: 'Como Jogar?',
    fechar: 'Entendi, vamos jogar!',
    tituloModal: 'Como jogar o Letreiro',
    descricao: 'Adivinhe o filme do dia, letra por letra.',
    idiomaPrincipal: 'Português',
    idiomaSecundario: 'Brasil',
    introducao: 'Seu objetivo é descobrir o título do filme do dia. Cada tentativa precisa preencher todo o tabuleiro e respeitar a quantidade de letras de cada palavra.',
    passos: [
      {
        numero: '1',
        titulo: 'Preencha o título',
        texto: 'Digite um palpite usando o teclado da tela ou o teclado físico. Cada bloco representa uma palavra do título do filme.',
      },
      {
        numero: '2',
        titulo: 'Envie sua tentativa',
        texto: 'Quando todas as casas estiverem preenchidas, pressione ENTER. As palavras digitadas precisam existir no dicionário do jogo.',
      },
      {
        numero: '3',
        titulo: 'Use as cores',
        texto: 'Depois de cada tentativa, as cores mostram o quanto cada letra se aproxima do título correto.',
      },
      {
        numero: '4',
        titulo: 'Peça dicas se precisar',
        texto: 'Você pode revelar o estúdio, o gênero ou uma versão desfocada do pôster. Quanto mais forte a dica, mais informação ela entrega.',
      },
    ],
    cores: {
      titulo: 'O que cada cor significa?',
      verde: ['Verde', 'A letra está na posição correta.'],
      amarelo: ['Amarelo', 'A letra existe e está na mesma palavra, mas em outra posição.'],
      roxo: ['Roxo', 'A letra existe no título, mas pertence a outra palavra.'],
      cinza: ['Cinza', 'A letra não está disponível nessa posição do título.'],
    },
    exemploTitulo: 'Exemplo de uma tentativa',
    exemploTexto: 'Misture as pistas de todas as tentativas até encontrar o filme. Não há limite fixo de tentativas.',
  },
  'en-us': {
    jogar: 'Play',
    comoJogar: 'How to Play?',
    fechar: 'Got it, let’s play!',
    tituloModal: 'How to play Letreiro',
    descricao: 'Guess the movie of the day, letter by letter.',
    idiomaPrincipal: 'English',
    idiomaSecundario: 'United States',
    introducao: 'Your goal is to discover the movie title of the day. Every guess must fill the whole board and match the number of letters in each word.',
    passos: [
      {
        numero: '1',
        titulo: 'Fill the title',
        texto: 'Type a guess using the on-screen keyboard or your physical keyboard. Each block represents one word in the movie title.',
      },
      {
        numero: '2',
        titulo: 'Submit your guess',
        texto: 'Once every tile is filled, press ENTER. Each word you enter must exist in the game dictionary.',
      },
      {
        numero: '3',
        titulo: 'Read the colors',
        texto: 'After each guess, the colors show how close each letter is to the correct movie title.',
      },
      {
        numero: '4',
        titulo: 'Use hints if needed',
        texto: 'You can reveal the studio, the genre, or a blurred version of the poster. Stronger hints reveal more information.',
      },
    ],
    cores: {
      titulo: 'What does each color mean?',
      verde: ['Green', 'The letter is in the correct position.'],
      amarelo: ['Yellow', 'The letter exists in the same word, but in a different position.'],
      roxo: ['Purple', 'The letter exists in the title, but belongs to another word.'],
      cinza: ['Gray', 'The letter is not available in that position of the title.'],
    },
    exemploTitulo: 'Example of a guess',
    exemploTexto: 'Combine the clues from every attempt until you find the movie. There is no fixed attempt limit.',
  },
} as const

export default function LandingHome() {
  const [idioma, setIdioma] = useState<Idioma>('pt-br')
  const [mostrarComoJogar, setMostrarComoJogar] = useState(false)
  const t = textos[idioma]

  useEffect(() => {
    document.documentElement.lang = idioma
  }, [idioma])

  const jogar = () => {
    window.location.assign(`/${idioma}`)
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
            <span className="landing-home__language-code">PT-BR</span>
            <span className="landing-home__language-copy">
              <strong>Português</strong>
              <small>Brasil</small>
            </span>
            <span className="landing-home__language-check" aria-hidden="true">✓</span>
          </button>

          <button
            type="button"
            className={idioma === 'en-us' ? 'is-active' : ''}
            onClick={() => setIdioma('en-us')}
            aria-pressed={idioma === 'en-us'}
          >
            <span className="landing-home__language-code">EN-US</span>
            <span className="landing-home__language-copy">
              <strong>English</strong>
              <small>United States</small>
            </span>
            <span className="landing-home__language-check" aria-hidden="true">✓</span>
          </button>
        </div>

        <div className="landing-home__actions">
          <button type="button" className="landing-home__play" onClick={jogar}>
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
            <div className="landing-home__modal-head">
              <div>
                <span className="landing-home__modal-kicker">🎬 LETREIRO</span>
                <h2 id="landing-how-title">{t.tituloModal}</h2>
              </div>
              <button
                type="button"
                className="landing-home__modal-x"
                onClick={() => setMostrarComoJogar(false)}
                aria-label={idioma === 'pt-br' ? 'Fechar' : 'Close'}
              >
                ×
              </button>
            </div>

            <p className="landing-home__modal-intro">{t.introducao}</p>

            <div className="landing-home__steps">
              {t.passos.map((passo) => (
                <article className="landing-home__step" key={passo.numero}>
                  <span className="landing-home__step-number">{passo.numero}</span>
                  <div>
                    <h3>{passo.titulo}</h3>
                    <p>{passo.texto}</p>
                  </div>
                </article>
              ))}
            </div>

            <section className="landing-home__example" aria-label={t.exemploTitulo}>
              <div className="landing-home__example-copy">
                <h3>{t.exemploTitulo}</h3>
                <p>{t.exemploTexto}</p>
              </div>
              <div className="landing-home__mini-board" aria-hidden="true">
                <div className="landing-home__mini-word">
                  <span className="mini-tile is-green">M</span>
                  <span className="mini-tile is-yellow">O</span>
                  <span className="mini-tile is-purple">V</span>
                  <span className="mini-tile is-gray">I</span>
                  <span className="mini-tile">E</span>
                </div>
              </div>
            </section>

            <section className="landing-home__legend">
              <h3>{t.cores.titulo}</h3>
              <div className="landing-home__legend-grid">
                <div className="landing-home__legend-item">
                  <span className="mini-tile is-green">A</span>
                  <p><strong>{t.cores.verde[0]}</strong><span>{t.cores.verde[1]}</span></p>
                </div>
                <div className="landing-home__legend-item">
                  <span className="mini-tile is-yellow">A</span>
                  <p><strong>{t.cores.amarelo[0]}</strong><span>{t.cores.amarelo[1]}</span></p>
                </div>
                <div className="landing-home__legend-item">
                  <span className="mini-tile is-purple">A</span>
                  <p><strong>{t.cores.roxo[0]}</strong><span>{t.cores.roxo[1]}</span></p>
                </div>
                <div className="landing-home__legend-item">
                  <span className="mini-tile is-gray">A</span>
                  <p><strong>{t.cores.cinza[0]}</strong><span>{t.cores.cinza[1]}</span></p>
                </div>
              </div>
            </section>

            <button type="button" className="landing-home__modal-close" onClick={() => setMostrarComoJogar(false)}>
              {t.fechar}
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
