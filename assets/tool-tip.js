import { removeTrapFocus, lockMobileScrolling, trapFocus, unlockMobileScrolling } from '@archetype-themes/utils/a11y'

class ToolTip extends HTMLElement {
  constructor() {
    super()
    this.el = this
    this.inner = this.querySelector('[data-tool-tip-inner]')
    this.closeButton = this.querySelector('[data-tool-tip-close]')
    this.toolTipContent = this.querySelector('[data-tool-tip-content]')
    this.toolTipTitle = this.querySelector('[data-tool-tip-title]')
    this.abortController = new AbortController()
    this._initEventListeners()
  }

  _initEventListeners() {
    document.addEventListener('tooltip:open', this._onTooltipOpen.bind(this), { signal: this.abortController.signal })
    document.addEventListener('drawerOpen', this._close.bind(this), { signal: this.abortController.signal })
    document.addEventListener('quickshop:product-blocks-loaded', this._lockScrolling.bind(this), {
      signal: this.abortController.signal
    })
  }

  _onTooltipOpen(e) {
    this._open(e.detail.context, e.detail.content)

    if (e.detail.tool_tip_classes) {
      this.el.classList.add(...e.detail.tool_tip_classes.split(' '))

      this.addEventListener(
        'tooltip:close',
        () => {
          this.el.classList.remove(...e.detail.tool_tip_classes.split(' '))
        },
        { once: true, signal: this.abortController.signal }
      )
    }
  }

  connectedCallback() {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', this._close.bind(this), { signal: this.abortController.signal })
    }

    document.documentElement.addEventListener(
      'click',
      (event) => {
        if (this.el.dataset.toolTipOpen === 'true' && !this.inner.contains(event.target)) this._close()
      },
      { signal: this.abortController.signal }
    )

    document.documentElement.addEventListener(
      'keydown',
      (event) => {
        if (event.code === 'Escape') this._close()
      },
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  _open(context, insertedHTML) {
    if (this.toolTipTitle && context != 'store-availability') {
      this.toolTipTitle.style.display = 'none'
    } else {
      this.toolTipTitle.style.display = 'none'
    }

    if (context !== 'QuickShop' && context !== 'QuickAdd') this.toolTipContent.innerHTML = insertedHTML

    setTimeout(() => {
      this._lockScrolling()
    }, 100)

    this.el.dataset.toolTipOpen = 'true'
    this.el.dataset.toolTip = context
  }

  _close() {
    if (document.body.classList.contains('photoswipe-open')) return

    this.dispatchEvent(
      new CustomEvent('tooltip:close', {
        detail: {
          context: this.el.dataset.toolTip
        },
        bubbles: true
      })
    )

    this.el.dataset.toolTipOpen = 'false'
    this._unlockScrolling()
  }

  _lockScrolling() {
    removeTrapFocus()

    lockMobileScrolling()
    document.documentElement.classList.add('modal-open')

    setTimeout(() => {
      trapFocus(this.el)
    }, 100)
  }

  _unlockScrolling() {
    removeTrapFocus()

    setTimeout(() => {
      unlockMobileScrolling()
      document.documentElement.classList.remove('modal-open')
    }, 100)
  }
}

customElements.define('tool-tip', ToolTip)
