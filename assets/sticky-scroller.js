import inView from '@archetype-themes/scripts/vendors/in-view'

class StickyScroller extends HTMLElement {
  constructor() {
    super()
    this.resizeObserver = new ResizeObserver(() => this.recalculateStyles())
    this.abortController = new AbortController()
    this.isScrolling = false
    this.position = 'relative'
    this.lastKnownScrollY = 0
    this.initialTop = 0
    this.currentTop = 0
    this.boundOnScroll = this.onScroll.bind(this)
  }

  connectedCallback() {
    inView(this, this.setupObservers.bind(this), { margin: '500px' })
  }

  disconnectedCallback() {
    this.cleanupObservers()
  }

  setupObservers() {
    this.resizeObserver.observe(this)
    window.addEventListener('scroll', this.boundOnScroll, { passive: true, signal: this.abortController.signal })
    return this.cleanupObservers.bind(this)
  }

  cleanupObservers() {
    this.abortController.abort()
    this.resizeObserver.disconnect()
  }

  onScroll() {
    if (!this.isScrolling) {
      requestAnimationFrame(() => {
        this.updatePosition()
        this.isScrolling = false
      })
      this.isScrolling = true
    }
  }

  recalculateStyles() {
    this.style.removeProperty('top')
    const { top, position } = getComputedStyle(this)
    this.initialTop = parseInt(top, 10)
    this.position = position
    this.updatePosition()
  }

  updatePosition() {
    if (this.position !== 'sticky') {
      this.style.removeProperty('top')
      return
    }

    const { top, height } = this.getBoundingClientRect()
    const maxTop = top + window.scrollY - this.offsetTop + this.initialTop
    const minTop = height - window.innerHeight + 20

    this.currentTop += this.lastKnownScrollY - window.scrollY
    this.currentTop = Math.min(Math.max(this.currentTop, -minTop), maxTop, this.initialTop)

    this.lastKnownScrollY = window.scrollY
    this.style.top = `${Math.round(this.currentTop)}px`
  }
}

customElements.define('sticky-scroller', StickyScroller)
