import { debounce } from '@archetype-themes/utils/utils'
import { EVENTS } from '@archetype-themes/utils/events'

class HeaderSection extends HTMLElement {
  disconnectedCallback() {
    this.abortController.abort()
  }

  connectedCallback() {
    this.abortController = new AbortController()
    document.addEventListener(EVENTS.overlayHeaderChange, this.handleOverlayHeaderChange.bind(this), {
      signal: this.abortController.signal
    })
    this.overlayHeader = false
    this.mobileMediaQuery = window.matchMedia(`(min-width: 769px)`)

    this.handleMediaQueryChange = this.handleMediaQueryChange.bind(this)
    this.mobileMediaQuery.addListener(this.handleMediaQueryChange)
    this.handleMediaQueryChange(this.mobileMediaQuery)

    // Cart class toggle
    document.addEventListener(
      EVENTS.headerDrawerOpened,
      (evt) => evt.target.getAttribute('open') === 'cart:open' && this.classList.add('cart-open'),
      {
        signal: this.abortController.signal
      }
    )
    document.addEventListener(
      EVENTS.headerDrawerClosed,
      (evt) => evt.target.getAttribute('close') === 'cart:close' && this.classList.remove('cart-open'),
      {
        signal: this.abortController.signal
      }
    )

    // Menu class toggle
    document.addEventListener(
      EVENTS.headerDrawerOpened,
      (evt) => evt.target.getAttribute('open') === 'mobileNav:open' && this.classList.add('mobile-nav-open'),
      {
        signal: this.abortController.signal
      }
    )
    document.addEventListener(
      EVENTS.headerDrawerClosed,
      (evt) => evt.target.getAttribute('close') === 'mobileNav:close' && this.classList.remove('mobile-nav-open'),
      {
        signal: this.abortController.signal
      }
    )

    if (Shopify && Shopify.designMode) {
      // Set a timer to resize the header in case the logo changes size
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'))
      }, 500)
    }

    window.addEventListener(
      'resize',
      debounce(300, () => this.dispatchEvent(new CustomEvent(EVENTS.sizeDrawer, { bubbles: true }))),
      { signal: this.abortController.signal }
    )
  }

  handleMediaQueryChange(mql) {
    if (mql.matches) {
      this.dispatchEvent(new CustomEvent(EVENTS.mobileNavClose, { bubbles: true }))
      this.classList.remove('mobile-nav-open')
    }
  }

  handleOverlayHeaderChange(event) {
    this.overlayHeader = event.detail.overlayHeader
  }
}

customElements.define('header-section', HeaderSection)
