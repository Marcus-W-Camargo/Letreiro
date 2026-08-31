import './Privacy.css'

export default function Privacy() {
  return (
    <main className="privacy-page">
      <article className="privacy-card">
        <a className="privacy-back" href="/pt-br">← Voltar ao Letreiro</a>
        <h1>Privacidade</h1>

        <p>
          O Letreiro utiliza armazenamento local do navegador para recursos funcionais do jogo,
          como preferência de tema, progresso do desafio, tentativas, dicas utilizadas e outros
          estados necessários para continuar a experiência. Essas informações permanecem no
          navegador e são usadas para manter preferências e progresso.
        </p>

        <p>
          O desafio diário é disponibilizado por meio do Supabase. O frontend consulta os dados do
          filme já salvo para a data acessada. O Letreiro também utiliza dados públicos de filmes do
          TMDB, incluindo informações relacionadas aos desafios e imagens de pôsteres.
        </p>

        <p>
          O site é hospedado na Vercel. Supabase, TMDB e Vercel são serviços externos e possuem suas
          próprias políticas de privacidade. A infraestrutura desses serviços pode processar dados
          técnicos necessários ao funcionamento e à segurança, incluindo registros técnicos de
          acesso e operação.
        </p>

        <p>
          Na versão atual do código do Letreiro, não foram identificados cookies publicitários nem
          ferramentas de analytics ou rastreamento.
        </p>

        <p className="privacy-updated">Última atualização: 31 de agosto de 2026.</p>
      </article>
    </main>
  )
}
