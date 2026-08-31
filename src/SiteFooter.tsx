import './SiteFooter.css'
import './FooterPrivacy.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Rodapé do site">
      <p>
        © 2026 Marcus Camargo. Todos os direitos reservados. Projeto desenvolvido para fins de estudo e portfólio.
        {' · '}
        <a className="site-footer__privacy" href="/pt-br/privacidade">Privacidade</a>
      </p>
    </footer>
  )
}
