class NavDropdown extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.summary = this.querySelector('summary')
    this.detail = this.querySelector('details')

    if (this.detail.dataset.hover === 'true') this.hoverMenu()
    this.menuDetailsHandler()
  }

  menuDetailsHandler() {
    // if the navDetail is open, then close it when the user clicks outside of it
    document.addEventListener(
      'click',
      (evt) => {
        if (this.detail.hasAttribute('open') && !this.detail.contains(evt.target)) {
          this.detail.removeAttribute('open')
          this.summary.setAttribute('aria-expanded', 'false')
        } else {
          if (this.detail.hasAttribute('open')) {
            this.summary.setAttribute('aria-expanded', 'false')
          } else {
            this.summary.setAttribute('aria-expanded', 'true')
          }
        }
      },
      { signal: this.abortController.signal }
    )
  }

  hoverMenu() {
    const summaryLink = this.summary.dataset.link

    this.summary.addEventListener(
      'click',
      (e) => {
        e.preventDefault()

        if (!this.detail.hasAttribute('open')) {
          this.detail.setAttribute('open', '')
          this.detail.setAttribute('aria-expanded', 'true')
        } else {
          window.location.href = summaryLink
        }
      },
      { signal: this.abortController.signal }
    )

    this.detail.addEventListener(
      'focusout',
      (e) => {
        const isChild = this.detail.contains(e.relatedTarget)

        if (!isChild) {
          this.detail.removeAttribute('open')
          this.detail.setAttribute('aria-expanded', 'false')
        }
      },
      { signal: this.abortController.signal }
    )

    this.detail.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && this.detail.hasAttribute('open')) {
          this.detail.removeAttribute('open')
          this.detail.setAttribute('aria-expanded', 'false')
          this.summary.focus()
        }
      },
      { signal: this.abortController.signal }
    )

    this.detail.addEventListener(
      'mouseover',
      () => {
        if (!this.detail.hasAttribute('open')) {
          this.detail.setAttribute('open', '')
          this.detail.setAttribute('aria-expanded', 'true')
        }
      },
      { signal: this.abortController.signal }
    )

    this.detail.addEventListener(
      'mouseleave',
      () => {
        if (this.detail.hasAttribute('open')) {
          this.detail.removeAttribute('open')
          this.detail.setAttribute('aria-expanded', 'false')
        }
      },
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }
}

customElements.define('nav-dropdown', NavDropdown)
