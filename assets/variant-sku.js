import { EVENTS } from '@archetype-themes/utils/events'

class VariantSku extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()

    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.handleVariantChange.bind(this),
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleVariantChange({ detail }) {
    const { html, sectionId, variant } = detail

    if (!variant) {
      this.textContent = ''
      return
    }

    const skuSource = html.querySelector(`[data-section-id="${sectionId}"] variant-sku`)

    if (skuSource) {
      this.textContent = skuSource.textContent
    }
  }
}

customElements.define('variant-sku', VariantSku)
