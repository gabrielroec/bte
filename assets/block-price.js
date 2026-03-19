import { EVENTS } from '@archetype-themes/utils/events'

class BlockPrice extends HTMLElement {
  constructor() {
    super()

    this.handleVariantChange = this.handleVariantChange.bind(this)
  }
  connectedCallback() {
    this.abortController = new AbortController()

    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.handleVariantChange,
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleVariantChange({ detail }) {
    const { html, variant } = detail

    if (!variant) {
      return
    }

    const priceSource = html.querySelector(`block-price[data-section-id="${this.dataset.sectionId}"] div`)
    const priceDestination = this.querySelector('div')

    if (priceSource && priceDestination) {
      priceDestination.outerHTML = priceSource.outerHTML
    }
  }
}

customElements.define('block-price', BlockPrice)
