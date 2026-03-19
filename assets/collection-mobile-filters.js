import { unlockMobileScrolling, lockMobileScrolling } from '@archetype-themes/utils/a11y'
import { EVENTS } from '@archetype-themes/utils/events'
import { prepareTransition } from '@archetype-themes/utils/utils'

class CollectionMobileFilters extends HTMLElement {
  connectedCallback() {
    this.selectors = {
      filters: '.filter-wrapper',
      inlineWrapper: '#CollectionInlineFilterWrap',
      sortBtn: '.filter-sort'
    }
    this.config = {
      mobileFiltersInPlace: false,
      isOpen: false
    }

    this.mobileMediaQuery = window.matchMedia(`(max-width: 768px)`)

    this.handleMediaQueryChange = this.handleMediaQueryChange.bind(this)
    this.mobileMediaQuery.addListener(this.handleMediaQueryChange)
    this.handleMediaQueryChange(this.mobileMediaQuery)

    this.abortController = new AbortController()

    document.addEventListener(EVENTS.toggleMobileFilters, this.toggle.bind(this), {
      signal: this.abortController.signal
    })
    document.addEventListener('filter:selected', this.close.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  async renderFiltersOnMobile() {
    if (this.config.mobileFiltersInPlace) {
      return
    }

    const filters = await this.getFilters()

    const inlineWrapper = this.querySelector(this.selectors.inlineWrapper)

    inlineWrapper.innerHTML = ''
    inlineWrapper.append(filters)

    this.sortBtns = this.querySelectorAll(this.selectors.sortBtn)
    if (this.sortBtns.length) {
      this.sortBtns.forEach((btn) =>
        btn.addEventListener('click', this.handleSortButtonClick.bind(this), { signal: this.abortController.signal })
      )
    }

    this.config.mobileFiltersInPlace = true
  }

  handleSortButtonClick(evt) {
    const btn = evt.currentTarget
    this.close()
    const sortValue = btn.dataset.value
    this.dispatchEvent(new CustomEvent(EVENTS.sortSelected, { detail: { sortValue }, bubbles: true }))
  }

  handleMediaQueryChange(mql) {
    if (mql.matches) {
      // Wait for ajax-renderer.js to make potential changes to URL parameters
      setTimeout(() => {
        this.renderFiltersOnMobile()
      }, 100)
    }
  }

  /*============================================================================
    Open and close filter drawer
  ==============================================================================*/
  toggle() {
    if (this.config.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    const filters = this.querySelector(this.selectors.filters)

    prepareTransition(filters, () => filters.classList.add('is-active'))

    this.config.isOpen = true

    lockMobileScrolling()

    // Bind the keyup event handler
    this._keyupHandler = (evt) => {
      if (evt.keyCode === 27) {
        this.close()
      }
    }
    window.addEventListener('keyup', this._keyupHandler, {
      signal: this.abortController.signal
    })
  }

  close() {
    const filters = this.querySelector(this.selectors.filters)

    prepareTransition(filters, () => filters.classList.remove('is-active'))

    this.config.isOpen = false

    unlockMobileScrolling()

    // Remove the keyup event handler
    window.removeEventListener('keyup', this._keyupHandler)
  }

  async getFilters() {
    const searchParams = window.location.search.slice(1)
    const url = `${window.location.pathname}?section_id=item-grid-filters&${searchParams}`
    const response = await fetch(url)

    if (!response.ok) {
      throw response
    }

    const responseText = await response.text()
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    return html.querySelector(this.selectors.filters)
  }
}

customElements.define('collection-mobile-filters', CollectionMobileFilters)
