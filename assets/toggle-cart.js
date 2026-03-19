import { EVENTS } from '@archetype-themes/utils/events'

class ToggleCart extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.cartOpen = false
    // Trigger to open cart drawer
    this.cartTrigger = this.querySelector(`[href="${window.Shopify.routes.root}cart"]`)

    if (!this.cartTrigger) return
    // Open cart drawer
    this.cartTrigger.addEventListener('click', this.handleClick.bind(this), { signal: this.abortController.signal })

    // Cart actions
    document.addEventListener(
      EVENTS.ajaxProductAdded,
      (evt) => {
        this.updateCartCount(evt.detail.product)
      },
      { signal: this.abortController.signal }
    )
    document.addEventListener(
      EVENTS.cartUpdated,
      (evt) => {
        this.updateCartCount(evt.detail.cart)
      },
      { signal: this.abortController.signal }
    )

    // Drawer actions
    document.addEventListener(EVENTS.headerDrawerClosed, this.handleDrawerClosed.bind(this), {
      signal: this.abortController.signal
    })
  }

  handleDrawerClosed() {
    this.cartOpen = false
    this.cartTrigger.setAttribute('aria-expanded', 'false')
  }

  handleClick(evt) {
    evt.preventDefault()
    if (this.cartOpen) {
      evt.target.dispatchEvent(new CustomEvent(EVENTS.cartClose, { bubbles: true }))
      this.cartTrigger.setAttribute('aria-expanded', 'false')
      this.cartOpen = false
    } else {
      evt.target.dispatchEvent(new CustomEvent(EVENTS.cartOpen, { bubbles: true }))
      this.cartTrigger.setAttribute('aria-expanded', 'true')
      this.cartOpen = true
    }
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  updateCartCount(state) {
    const html = new DOMParser().parseFromString(state.sections['cart-ajax'], 'text/html')
    const newCartCount = html.querySelector('.cart-link__bubble')
    const cartCount = this.querySelector('.cart-link__bubble')
    if (!newCartCount || !cartCount) return
    cartCount.outerHTML = newCartCount.outerHTML
  }
}

customElements.define('toggle-cart', ToggleCart)
