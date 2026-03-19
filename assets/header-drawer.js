import { prepareTransition } from '@archetype-themes/utils/utils'
import { trapFocus, removeTrapFocus, lockScroll, unlockScroll } from '@archetype-themes/utils/a11y'
import { EVENTS } from '@archetype-themes/utils/events'

class HeaderDrawer extends HTMLElement {
  constructor() {
    super()
    this.isOpen = false
    this.abortController = new AbortController()
  }
  connectedCallback() {
    if (!this.getAttribute('open') || !this.getAttribute('close')) return
    document.addEventListener(this.getAttribute('open'), this.open.bind(this), { signal: this.abortController.signal })
    document.addEventListener(this.getAttribute('close'), this.close.bind(this), {
      signal: this.abortController.signal
    })
  }

  open(evt) {
    this.activeElement = evt.target

    this.dispatchEvent(new CustomEvent(EVENTS.sizeDrawer, { bubbles: true }))

    prepareTransition(
      this,
      function () {
        this.classList.add('is-active')
      }.bind(this)
    )

    // Trap focus
    trapFocus(this)

    lockScroll()

    // Esc key closes the drawer
    window.addEventListener('keyup', this.handleWindowKeyup, { signal: this.abortController.signal })

    this.dispatchEvent(new CustomEvent(EVENTS.headerOverlayRemoveClass, { bubbles: true }))
    this.dispatchEvent(new CustomEvent(EVENTS.headerDrawerOpened, { bubbles: true }))
    this.dispatchEvent(new CustomEvent('drawerOpen', { bubbles: true }))

    this.isOpen = true

    // Clicking out of the drawer closes it
    setTimeout(() => {
      window.addEventListener('click', this.handleWindowClick, { signal: this.abortController.signal })
    }, 0)
  }

  close(evt, noAnimate) {
    // Do not close if click event came from inside drawer
    if (evt && evt.target.closest && evt.target.closest('.site-header__drawer')) {
      return
    }

    if (!this.isOpen) {
      return
    }

    if (noAnimate) {
      this.classList.remove('is-active')
    } else {
      prepareTransition(
        this,
        function () {
          this.classList.remove('is-active')
        }.bind(this)
      )
    }

    this.dispatchEvent(new CustomEvent(EVENTS.headerDrawerClosed, { bubbles: true }))

    window.removeEventListener('keyup', this.handleWindowKeyup)
    window.removeEventListener('click', this.handleWindowClick)

    this.isOpen = false

    // Remove focus trap
    if (this.activeElement) removeTrapFocus(this.activeElement)

    unlockScroll()
  }

  handleWindowKeyup = (evt) => {
    if (evt.keyCode === 27) {
      this.close()
    }
  }

  handleWindowClick = (evt) => {
    this.close(evt)
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

customElements.define('header-drawer', HeaderDrawer)
