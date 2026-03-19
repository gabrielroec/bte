import Modals from '@archetype-themes/modules/modal'
import { EVENTS } from '@archetype-themes/utils/events'
import Drawers from '@archetype-themes/modules/drawers'

class StoreAvailability extends HTMLElement {
  constructor() {
    super()

    this.selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      modalOpenBtn: '.js-modal-open-availability',
      productTitle: '[data-availability-product-title]'
    }

    this.baseUrl = this.dataset.baseUrl
    this.productTitle = this.dataset.productName
    this.variantId = this.dataset.variantId
  }

  connectedCallback() {
    this.abortController = new AbortController()
    this.updateContent(this.variantId)

    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.handleVariantChange.bind(this),
      { signal: this.abortController.signal }
    )
  }

  handleVariantChange({ detail }) {
    const { variant } = detail
    if (!variant) return
    this.updateContent(variant.id)
  }

  updateContent(variantId) {
    const variantSectionUrl = `${this.baseUrl}/variants/${variantId}/?section_id=store-availability`

    fetch(variantSectionUrl)
      .then((response) => {
        return response.text()
      })
      .then((html) => {
        if (html.trim() === '') {
          this.innerHTML = ''
          return
        }

        this.innerHTML = html
        this.innerHTML = this.firstElementChild.innerHTML

        // Setup drawer if have open button
        if (this.querySelector(this.selectors.drawerOpenBtn)) {
          this.drawer = new Drawers('StoreAvailabilityDrawer', 'availability')
        }

        // Setup modal if have open button
        if (this.querySelector(this.selectors.modalOpenBtn)) {
          this.modal = new Modals('StoreAvailabilityModal', 'availability')
        }

        const title = this.querySelector(this.selectors.productTitle)
        if (title) {
          title.textContent = this.productTitle
        }
      })
  }
}

customElements.define('store-availability', StoreAvailability)
