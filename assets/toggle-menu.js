import { EVENTS } from '@archetype-themes/utils/events'

class ToggleMenu extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.isMobileNavOpen = false
    // Trigger to open header nav
    this.openTrigger = this.querySelector('[aria-controls="MobileNav"]')

    if (!this.openTrigger) return
    // Open/close mobile nav
    this.openTrigger.addEventListener('click', this.handleClick.bind(this), { signal: this.abortController.signal })

    // Drawer actions
    document.addEventListener(EVENTS.headerDrawerClosed, this.handleDrawerClosed.bind(this), {
      signal: this.abortController.signal
    })
  }

  handleClick(evt) {
    evt.preventDefault()
    if (this.isMobileNavOpen) {
      evt.target.dispatchEvent(new CustomEvent(EVENTS.mobileNavClose, { bubbles: true }))
      this.openTrigger.classList.remove('is-active')
      // this.classList.remove('mobile-nav-open')
      this.isMobileNavOpen = false
    } else {
      evt.target.dispatchEvent(new CustomEvent(EVENTS.mobileNavOpen, { bubbles: true }))
      this.openTrigger.classList.add('is-active')
      // this.classList.add('mobile-nav-open')
      this.isMobileNavOpen = true
    }
  }

  handleDrawerClosed() {
    this.isMobileNavOpen = false
    this.openTrigger.classList.remove('is-active')
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

customElements.define('toggle-menu', ToggleMenu)
