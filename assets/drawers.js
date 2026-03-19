import { prepareTransition } from '@archetype-themes/utils/utils'
import { trapFocus, removeTrapFocus, lockMobileScrolling, unlockMobileScrolling } from '@archetype-themes/utils/a11y'

export default class Drawers {
  constructor(id, name) {
    this.config = {
      id: id,
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + name,
      openClass: 'js-drawer-open',
      closingClass: 'js-drawer-closing',
      activeDrawer: 'drawer--is-open',
      namespace: '.drawer-' + name
    }

    this.nodes = {
      page: document.querySelector('#MainContent')
    }

    this.drawer = document.querySelector('#' + id)
    this.isOpen = false
    this.abortController = new AbortController()

    if (!this.drawer) {
      return
    }

    this.init()
  }

  init() {
    document.querySelectorAll(this.config.open).forEach((openBtn) => {
      openBtn.setAttribute('aria-expanded', 'false')
      openBtn.addEventListener('click', this.open.bind(this), { signal: this.abortController.signal })
    })

    this.drawer
      .querySelector(this.config.close)
      .addEventListener('click', this.close.bind(this), { signal: this.abortController.signal })

    document.addEventListener('modalOpen', this.close.bind(this), { signal: this.abortController.signal })
  }

  open(evt, returnFocusEl) {
    if (evt) {
      evt.preventDefault()
    }

    if (this.isOpen) {
      return
    }

    if (evt && evt.stopPropagation) {
      evt.stopPropagation()
      evt.currentTarget.setAttribute('aria-expanded', 'true')
      this.activeSource = evt.currentTarget
    } else if (returnFocusEl) {
      returnFocusEl.setAttribute('aria-expanded', 'true')
      this.activeSource = returnFocusEl
    }

    prepareTransition(this.drawer, () => {
      this.drawer.classList.add(this.config.activeDrawer)
    })

    document.documentElement.classList.add(this.config.openClass)
    this.isOpen = true

    trapFocus(this.drawer)

    document.dispatchEvent(new CustomEvent('drawerOpen'))
    document.dispatchEvent(new CustomEvent('drawerOpen.' + this.config.id))

    this.bindEvents()
  }

  close(evt) {
    if (!this.isOpen) {
      return
    }

    if (evt) {
      if (evt.target.closest('.js-drawer-close')) {
        // Do not close if using the drawer close button
      } else if (evt.target.closest('.drawer')) {
        return
      }
    }

    document.activeElement.blur()

    prepareTransition(this.drawer, () => {
      this.drawer.classList.remove(this.config.activeDrawer)
    })

    document.documentElement.classList.remove(this.config.openClass)
    document.documentElement.classList.add(this.config.closingClass)

    window.setTimeout(() => {
      document.documentElement.classList.remove(this.config.closingClass)
      if (this.activeSource && this.activeSource.getAttribute('aria-expanded')) {
        this.activeSource.setAttribute('aria-expanded', 'false')
        this.activeSource.focus()
      }
    }, 500)

    this.isOpen = false

    removeTrapFocus()

    this.unbindEvents()
  }

  bindEvents() {
    this._clickHandler = this._handleClickOutside.bind(this)
    this._keyupHandler = this._handleKeyUp.bind(this)

    document.addEventListener('click', this._clickHandler, { signal: this.abortController.signal })
    document.addEventListener('keyup', this._keyupHandler, { signal: this.abortController.signal })

    lockMobileScrolling(this.nodes.page)
  }

  unbindEvents() {
    this.abortController.abort()
    unlockMobileScrolling(this.nodes.page)
  }

  _handleClickOutside(evt) {
    this.close(evt)
  }

  _handleKeyUp(evt) {
    if (evt.keyCode === 27) {
      this.close()
    }
  }
}
