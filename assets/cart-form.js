import { executeJSmodules } from '@archetype-themes/utils/utils'
import { EVENTS } from '@archetype-themes/utils/events'

/*============================================================================
  CartForm
  - Prevent checkout when terms checkbox exists
  - Listen to quantity changes, rebuild cart (both widget and page)
==============================================================================*/
export default class CartForm {
  constructor(form) {
    this.selectors = {
      products: '[data-products]',
      discounts: '[data-discounts]',
      subTotal: '[data-subtotal]',

      locales: '[data-locales]',
      termsCheckbox: '.cart__terms-checkbox',
      checkoutBtn: '.cart__checkout'
    }

    this.classes = {
      btnLoading: 'btn--loading'
    }

    this.config = {
      requiresTerms: false
    }

    if (!form) {
      return
    }

    this.form = form
    this.wrapper = form.parentNode
    this.products = form.querySelector(this.selectors.products)
    this.submitBtn = form.querySelector(this.selectors.checkoutBtn)

    this.discounts = form.querySelector(this.selectors.discounts)
    this.subtotal = form.querySelector(this.selectors.subTotal)
    this.termsCheckbox = form.querySelector(this.selectors.termsCheckbox)
    this.locales = JSON.parse(this.form.querySelector(this.selectors.locales).textContent)

    if (this.termsCheckbox) {
      this.config.requiresTerms = true
    }

    this.init()
  }

  init() {
    document.addEventListener('cart:quantity', this.quantityChanged.bind(this))

    this.form.addEventListener('submit', this.onSubmit.bind(this))

    // Dev-friendly way to build the cart
    document.addEventListener(
      'cart:build',
      function () {
        this.buildCart()
      }.bind(this)
    )
  }

  onSubmit(evt) {
    this.submitBtn.classList.add(this.classes.btnLoading)

    /*
      Checks for drawer or cart open class on body element
      and then stops the form from being submitted.

      Error is handled in the quantityChanged method

      For Expanse/Fetch/Gem/Vino quick add, if an error is present it is alerted
      through the add to cart fetch request in quick-add.js.
    */

    if (
      (document.documentElement.classList.contains('js-drawer-open') && this.cartItemsUpdated) ||
      (document.documentElement.classList.contains('cart-open') && this.cartItemsUpdated)
    ) {
      this.submitBtn.classList.remove(this.classes.btnLoading)
      evt.preventDefault()
      return false
    }

    if (this.config.requiresTerms) {
      if (this.termsCheckbox.checked) {
        // continue to checkout
      } else {
        alert(this.locales.cartTermsConfirmation)
        this.submitBtn.classList.remove(this.classes.btnLoading)
        evt.preventDefault()
        return false
      }
    }
  }

  /*============================================================================
    Query cart page to get markup
  ==============================================================================*/
  _parseProductHTML(text) {
    const html = document.createElement('div')
    html.innerHTML = text

    return {
      items: html.querySelector('.cart__items'),
      discounts: html.querySelector('.cart__discounts'),
      subtotal: html.querySelector('.cart__subtotal'),
      count: html.querySelector('.cart-link__bubble')
    }
  }

  buildCart() {
    return this.getCartProductMarkup().then(this.cartMarkup.bind(this))
  }

  cartMarkup(text) {
    const markup = this._parseProductHTML(text)
    const items = markup.items
    const count = parseInt(items.dataset.count)
    const subtotal = markup.subtotal.innerHTML

    this.updateCartDiscounts(markup.discounts)

    if (count > 0) {
      this.wrapper.classList.remove('is-empty')
    } else {
      this.wrapper.classList.add('is-empty')
    }

    // Append item markup
    this.products.innerHTML = ''
    this.products.append(items)
    const scripts = this.products.querySelectorAll('script[type="module"]')
    executeJSmodules(scripts)

    // Update subtotal
    this.subtotal.innerHTML = subtotal

    if (Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize()
    }
  }

  updateCartDiscounts(markup) {
    if (!this.discounts) {
      return
    }
    this.discounts.innerHTML = ''
    this.discounts.append(markup)
  }

  quantityChanged(evt) {
    const key = evt.detail[0]
    const qty = evt.detail[1]
    const el = evt.detail[2]

    if (!key || !qty) {
      return
    }

    // Disable qty selector so multiple clicks can't happen while loading
    if (el) {
      el.classList.add('is-loading')
    }

    this.changeItem({
      id: key,
      quantity: qty,
      // Bundled section rendering
      sections: 'cart-ajax'
    })
      .then((state) => {
        this.cartMarkup(state.sections['cart-ajax'])
        document.dispatchEvent(new CustomEvent(EVENTS.cartUpdated, { detail: { cart: state } }))
      })
      .catch(async (response) => {
        const data = await response.json()
        alert(data.description)
        // Enable qty selector again
        el.classList.remove('is-loading')
        // Reset quantity input to initial value
        el.firstElementChild.value = el.firstElementChild.dataset.initialValue
      })
  }

  changeItem(body) {
    return fetch(`${window.Shopify.routes.root}cart/change.js`, {
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

  getCartProductMarkup() {
    let url = `${window.Shopify.routes.root}?section_id=cart-ajax`

    return fetch(url, {
      credentials: 'same-origin',
      method: 'GET'
    })
      .then((response) => response.text())
      .catch((e) => console.error(e))
  }
}
