import { EVENTS } from '@archetype-themes/utils/events'

class ToggleSearch extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.isOpen = false
    // Trigger to open header search
    this.trigger = this.querySelector(`[href="${window.Shopify.routes.root}search"]`)

    if (!this.trigger) return
    // Open header search
    this.trigger.addEventListener('click', this.handleClick.bind(this), { signal: this.abortController.signal })
    // Close header search
    document.addEventListener(EVENTS.predictiveSearchCloseAll, this.handleSearchCloseAll.bind(this), {
      signal: this.abortController.signal
    })
  }

  handleClick(evt) {
    evt.preventDefault()
    evt.stopImmediatePropagation()
    this.isOpen = !this.isOpen
    this.dispatchEvent(new CustomEvent(EVENTS.headerSearchOpen, { bubbles: true }))
    this.trigger.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false')
  }

  handleSearchCloseAll() {
    this.isOpen = false
    this.trigger.setAttribute('aria-expanded', 'false')
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

customElements.define('toggle-search', ToggleSearch)
