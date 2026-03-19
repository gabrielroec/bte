import CartForm from '@archetype-themes/modules/cart-form'
import { lockMobileScrolling, unlockMobileScrolling, trapFocus, removeTrapFocus } from '@archetype-themes/utils/a11y'
import { prepareTransition, sizeDrawer } from '@archetype-themes/utils/utils'
import { EVENTS, subscribe, publish } from '@archetype-themes/utils/pubsub'

export default class HeaderCart {
  constructor() {
    this.selectors = {
      cartTrigger: '#HeaderCartTrigger',
      cart: '#HeaderCart',

      closeBtn: '.js-close-header-cart',
      noteBtn: '.add-note'
    }

    this.classes = {
      hidden: 'hide'
    }

    this.config = {
      cartOpen: false,
      namespace: '.cart-header'
    }

    this.wrapper = document.querySelector(this.selectors.cart)
    if (!this.wrapper) {
      return
    }
    this.trigger = document.querySelector(this.selectors.cartTrigger)
    this.noteBtn = this.wrapper.querySelector(this.selectors.noteBtn)
    this.form = this.wrapper.querySelector('form')
    this.cartType = this.form.dataset.cartType
    this.overlayHeader = false

    this.abortController = new AbortController()

    this._handleKeyUp = this._handleKeyUp.bind(this)
    this._handleClickOutside = this._handleClickOutside.bind(this)

    // Close header cart
    document.addEventListener('MobileNav:open', this.close.bind(this), { signal: this.abortController.signal })
    document.addEventListener('modalOpen', this.close.bind(this), { signal: this.abortController.signal })

    this.unsubscribeOverlayHeader = subscribe(EVENTS.overlayHeaderChange, this.handleOverlayHeaderChange.bind(this))

    this.init()
  }

  disconnectedCallback() {
    this.productAddedUnsubscriber?.()
    this.unsubscribeOverlayHeader?.()
    this.abortController.abort()
  }

  init() {
    this.cartForm = new CartForm(this.form)
    this.cartForm.buildCart()

    this.trigger.addEventListener('click', this.open.bind(this), { signal: this.abortController.signal })

    document.querySelectorAll(this.selectors.closeBtn).forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          this.close()
        },
        { signal: this.abortController.signal }
      )
    })

    if (this.noteBtn) {
      this.noteBtn.addEventListener(
        'click',
        () => {
          this.noteBtn.classList.toggle('is-active')
          this.wrapper.querySelector('.cart__note').classList.toggle('hide')
        },
        { signal: this.abortController.signal }
      )
    }

    this.productAddedUnsubscriber = subscribe(EVENTS.ajaxProductAdded, this.handleCartChange.bind(this))

    // Dev-friendly way to open cart
    document.addEventListener('cart:open', this.open.bind(this), { signal: this.abortController.signal })
    document.addEventListener('cart:close', this.close.bind(this), { signal: this.abortController.signal })
  }

  handleOverlayHeaderChange(event) {
    this.overlayHeader = event.detail.overlayHeader
  }

  async handleCartChange(evt) {
    await this.cartForm.buildCart()

    publish(EVENTS.cartDrawerChange)

    if (!this.config.cartOpen && !evt.detail.preventCartOpen) {
      this.open(evt)
    }

    // Resets cart property so that the form submit button can work
    if (this.cartForm.cartItemsUpdated) {
      this.cartForm.cartItemsUpdated = false
    }
  }

  open(evt) {
    this.activeElement = evt.target

    if (this.cartType !== 'dropdown') {
      return
    }

    if (evt) {
      evt.preventDefault()
    }

    sizeDrawer()

    prepareTransition(this.wrapper, () => {
      this.wrapper.classList.add('is-active')
      this.wrapper.scrollTop = 0
    })

    document.documentElement.classList.add('cart-open')

    // Trap focus
    trapFocus(this.wrapper)

    // Don't lock mobile scrolling if sticky header isn't present
    if (!matchMedia('(max-width: 768px)').matches && this.overlayHeader) {
      lockMobileScrolling()
    }

    // Esc closes cart popup
    window.addEventListener('keyup', this._handleKeyUp, { signal: this.abortController.signal })

    publish(EVENTS.headerOverlayRemoveClass)

    document.dispatchEvent(new CustomEvent('CartDrawer:open'))
    document.dispatchEvent(new CustomEvent('drawerOpen'))

    // Clicking out of cart closes it. Timeout to prevent immediate bubbling
    setTimeout(() => {
      window.addEventListener('click', this._handleClickOutside, { signal: this.abortController.signal })
    }, 0)

    this.config.cartOpen = true
  }

  close(evt) {
    if (this.cartType !== 'dropdown') {
      return
    }

    // Do not close if click event came from inside drawer
    if (evt && evt.target.closest && evt.target.closest('.site-header__cart')) {
      return
    }

    if (!this.config.cartOpen) {
      return
    }

    // If custom event, close without transition
    if (evt && evt.type === 'MobileNav:open') {
      this.wrapper.classList.remove('is-active')
    } else {
      prepareTransition(this.wrapper, () => {
        this.wrapper.classList.remove('is-active')
      })
    }

    window.removeEventListener('keyup', this._handleKeyUp)
    window.removeEventListener('click', this._handleClickOutside)

    if (!matchMedia('(max-width: 768px)').matches && this.overlayHeader) {
      unlockMobileScrolling()
    }

    document.documentElement.classList.remove('cart-open')

    this.config.cartOpen = false

    // Remove focus trap
    if (!evt && this.activeElement) removeTrapFocus(this.activeElement)
  }

  _handleKeyUp(evt) {
    if (evt.keyCode === 27) {
      this.close()
    }
  }

  _handleClickOutside(evt) {
    this.close(evt)
  }
}
