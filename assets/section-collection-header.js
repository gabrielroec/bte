import { EVENTS } from '@archetype-themes/utils/events'

let hasLoadedBefore = false

class CollectionHeader extends HTMLElement {
  constructor() {
    super()

    this.overlayHeader = false
    this.heroImageContainer = this.querySelector('.collection-hero')
    this.handleOverlayHeaderChange = this.handleOverlayHeaderChange.bind(this)
  }

  connectedCallback() {
    this.abortController = new AbortController()

    document.addEventListener(EVENTS.overlayHeaderChange, this.handleOverlayHeaderChange, {
      signal: this.abortController.signal
    })

    if (this.heroImageContainer) {
      if (hasLoadedBefore) {
        this.checkIfNeedReload()
      }

      this.heroImageContainer.classList.remove('loading', 'loading--delayed')
      this.heroImageContainer.classList.add('loaded')
    } else if (this.overlayHeader) {
      this.dispatchEvent(new CustomEvent(EVENTS.headerOverlayDisable), { bubbles: true })
    }

    hasLoadedBefore = true
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleOverlayHeaderChange(event) {
    this.overlayHeader = event.detail.overlayHeader

    if (!this.overlayHeader && !this.heroImageContainer) {
      this.dispatchEvent(new CustomEvent(EVENTS.headerOverlayDisable), { bubbles: true })
    }
  }

  checkIfNeedReload() {
    if (!Shopify.designMode) {
      return
    }

    if (this.overlayHeader) {
      const header = document.querySelector('.header-wrapper')
      if (!header.classList.contains('header-wrapper--overlay')) {
        location.reload()
      }
    }
  }
}

customElements.define('section-collection-header', CollectionHeader)
