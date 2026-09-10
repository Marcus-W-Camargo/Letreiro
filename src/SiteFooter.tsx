import './SiteFooter.css'
import './FooterPrivacy.css'

export default function SiteFooter() {
  const ingles = window.location.pathname.toLowerCase().startsWith('/en-us')

  return (
    <footer className="site-footer" aria-label={ingles ? 'Site footer' : 'Rodapé do site'}>
      <p>
        {ingles
          ? '© 2026 Marcus Camargo. All rights reserved. Project developed for study and portfolio purposes.'
          : '© 2026 Marcus Camargo. Todos os direitos reservados. Projeto desenvolvido para fins de estudo e portfólio.'}
        {' · '}
        <a
          className="site-footer__privacy"
          href={ingles ? '/en-us/privacy' : '/pt-br/privacidade'}
        >
          {ingles ? 'Privacy' : 'Privacidade'}
        </a>
      </p>
    </footer>
  )
}
