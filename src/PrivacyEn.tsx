import './Privacy.css'

export default function PrivacyEn() {
  return (
    <main className="privacy-page">
      <article className="privacy-card">
        <a className="privacy-back" href="/en-us">← Back to Letreiro</a>
        <h1>Privacy</h1>

        <p>
          Letreiro uses local browser storage for functional game features such as theme preference,
          challenge progress, attempts, used hints and other state required to continue the experience.
          This information remains in the browser and is used to preserve preferences and progress.
        </p>

        <p>
          The daily challenge is provided through Supabase. The frontend reads the movie data already
          stored for the selected date. Letreiro also uses public movie data from TMDB, including
          challenge information and poster images.
        </p>

        <p>
          The site is hosted on Vercel. Supabase, TMDB and Vercel are external services and have their
          own privacy policies. Their infrastructure may process technical data required for operation
          and security, including technical access and service logs.
        </p>

        <p>
          In the current Letreiro codebase, no advertising cookies, analytics tools or tracking tools
          have been identified.
        </p>

        <p className="privacy-updated">Last updated: August 31, 2026.</p>
      </article>
    </main>
  )
}
