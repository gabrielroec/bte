class FooterSection extends HTMLElement {
  connectedCallback() {
    this.ids = {
      mobileNav: 'MobileNav',
      footerNavWrap: 'FooterMobileNavWrap',
      footerNav: 'FooterMobileNav'
    }

    this.init()
  }

  init() {
    // Change email icon to submit text
    const newsletterInput = document.querySelector('.footer__newsletter-input')
    if (newsletterInput) {
      newsletterInput.addEventListener('keyup', function () {
        newsletterInput.classList.add('footer__newsletter-input--active')
      })
    }

    this.mobileMediaQuery = window.matchMedia('(max-width: 768px)')
    // If on mobile, copy the mobile nav to the footer
    if (this.mobileMediaQuery.matches) {
      this.initDoubleMobileNav()
    }
    // Listen for changes to the media query
    this.mobileMediaQuery.addListener(this.handleMediaQueryChange.bind(this))
  }

  handleMediaQueryChange(mql) {
    if (mql.matches) {
      this.initDoubleMobileNav()
    }
  }

  initDoubleMobileNav() {
    if (this.hasDoubleMobileNav) {
      return
    }

    const menuPlaceholder = document.getElementById(this.ids.footerNavWrap)
    if (!menuPlaceholder) {
      return
    }

    const mobileNav = document.querySelector(`mobile-nav[container="${this.ids.mobileNav}"]`)
    const footerNav = document.getElementById(this.ids.footerNav)
    const clone = mobileNav.cloneNode(true)
    clone.setAttribute('container', this.ids.footerNav)
    clone.setAttribute('inHeader', 'false')

    // Append cloned nav to footer, initialize JS, then show it
    footerNav.appendChild(clone)

    menuPlaceholder.classList.remove('hide')
    this.hasDoubleMobileNav = true
  }
}

customElements.define('footer-section', FooterSection)
