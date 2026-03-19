import { EVENTS } from '@archetype-themes/utils/events'

class CloseCart extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()

    // Trigger to close cart drawer
    this.cartCloseButton = document.querySelector('.js-close-header-cart')

    if (!this.cartCloseButton) return
    this.cartCloseButton.addEventListener('click', this.handleClick.bind(this), { signal: this.abortController.signal })
  }

  handleClick(evt) {
    evt.preventDefault()
    evt.target.dispatchEvent(new CustomEvent(EVENTS.cartClose, { bubbles: true }))
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

customElements.define('close-cart', CloseCart)
