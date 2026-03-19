const selectors = {
  input: '.js-qty__num',
  plus: '.js-qty__adjust--plus',
  minus: '.js-qty__adjust--minus'
}

class QuantitySelector extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()

    this.plus = this.querySelector(selectors.plus)
    this.minus = this.querySelector(selectors.minus)
    this.input = this.querySelector(selectors.input)
    this.minValue = this.input.getAttribute('min') || 1
    this.maxValue = this.input.getAttribute('max')

    this.plus.addEventListener(
      'click',
      function () {
        let qty = this._getQty()
        this._change(qty + 1)
      }.bind(this),
      { signal: this.abortController.signal }
    )

    this.minus.addEventListener(
      'click',
      function () {
        let qty = this._getQty()
        this._change(qty - 1)
      }.bind(this),
      { signal: this.abortController.signal }
    )

    this.input.addEventListener(
      'change',
      function (evt) {
        this._change(this._getQty())
      }.bind(this),
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  _getQty() {
    let qty = this.input.value
    if (parseFloat(qty) == parseInt(qty) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1
    }
    return parseInt(qty)
  }

  _change(qty) {
    if (qty <= this.minValue) {
      qty = this.minValue
    }

    if (this.maxValue && qty > this.maxValue) {
      qty = this.maxValue
    }

    this.input.value = qty

    if (this.key !== '') {
      this.dispatchEvent(
        new CustomEvent('cart:quantity', {
          bubbles: true,
          detail: [this.key, qty, this]
        })
      )
    } else {
      this.dispatchEvent(
        new CustomEvent('quantity:change', {
          detail: {
            qty: qty
          }
        })
      )
    }
  }
  get key() {
    return this.getAttribute('key')
  }
}

customElements.define('quantity-selector', QuantitySelector)
