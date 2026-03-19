import { EVENTS } from '@archetype-themes/utils/events'
import { trapFocus, removeTrapFocus } from '@archetype-themes/utils/a11y'

const classes = {
  isAdded: 'is-added'
}

class AddToCart extends HTMLElement {
  constructor() {
    super()

    this.handleCartDrawerChange = this.handleCartDrawerChange.bind(this)
  }

  connectedCallback() {
    this.qtySelector = this.querySelector('quantity-selector')
    this.qtySelectorInput = this.qtySelector?.querySelector('input[name="quantity"]')
    this.button = this.querySelector('.js-add-to-cart')
    this.successMessage = this.querySelector('.js-added')
    this.abortController = new AbortController()
    this.variantId = this.dataset.variantId
    this.changingQuantity = false
    this.smallContainer = false
    this.activeElement = null
    this.count = this.getAttribute('data-count') ? parseInt(this.getAttribute('data-count')) : 0
    this.container = this.closest('.product-grid-item')

    if (!this.button || !this.qtySelector) return

    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this))
    if (!this.count && this.container) this.resizeObserver.observe(this.container)

    this.qtySelector.addEventListener('quantity:change', this.handleQuantityChange.bind(this), {
      signal: this.abortController.signal
    })

    this.addEventListener('mouseover', this.open.bind(this), {
      signal: this.abortController.signal
    })

    this.addEventListener('mouseout', this.close.bind(this), {
      signal: this.abortController.signal
    })

    this.button.addEventListener(
      'click',
      () => {
        this.button.getAttribute('aria-expanded') == 'false' ? this.open() : this.close()
      },
      {
        signal: this.abortController.signal
      }
    )

    this.addEventListener(
      'focusout',
      (evt) => (!this.contains(evt.relatedTarget) || !this.contains(evt.target)) && this.close(),
      {
        signal: this.abortController.signal
      }
    )

    this.addEventListener('keydown', (evt) => evt.key === 'Escape' && this.close(), {
      signal: this.abortController.signal
    })

    document.addEventListener(EVENTS.cartDrawerChange, this.handleCartDrawerChange, {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  open() {
    if (!this.button || this.count || this.smallContainer) return
    this.button.setAttribute('aria-expanded', 'true')
    this.button.setAttribute('disabled', 'disabled')
    this.classList.remove(classes.isAdded)
    // Focus the quantity selector input
    if (this.contains(document.activeElement)) {
      this.qtySelectorInput.focus()
    }
  }

  close() {
    if (!this.button || this.changingQuantity || this.count || this.smallContainer) return
    this.button.setAttribute('aria-expanded', 'false')
    this.button.removeAttribute('disabled')
    if (this.activeElement) this.activeElement.focus()
  }

  async handleQuantityChange({ detail }) {
    if (this.contains(document.activeElement)) this.activeElement = document.activeElement

    this.changingQuantity = true

    const body = {
      updates: {
        [this.variantId]: detail.qty
      },
      // Bundled section rendering
      sections: ['cart-ajax']
    }

    const response = await this.updateCart(body)

    this.handleProductAdded(response)
  }

  handleProductAdded(response) {
    this.dispatchEvent(
      new CustomEvent(EVENTS.ajaxProductAdded, {
        bubbles: true,
        detail: {
          product: response,
          preventCartOpen: true
        }
      })
    )

    if (this.activeElement.classList.contains('js-qty__adjust--plus')) {
      this.classList.add(classes.isAdded)
      trapFocus(this.successMessage)
    }
  }

  async updateCart(body) {
    // https://shopify.dev/docs/api/ajax/reference/cart#post-locale-cart-update-js
    return fetch(`${window.Shopify.routes.root}cart/update.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then((response) => {
      if (!response.ok) throw response
      return response.json()
    })
  }

  handleCartDrawerChange() {
    this.classList.remove(classes.isAdded)
    removeTrapFocus(this.activeElement)
  }

  handleResize() {
    if (this?.container?.offsetWidth <= 235) this.smallContainer = true
    else this.smallContainer = false
  }
}

customElements.define('at-add-to-cart', AddToCart)
