import { EVENTS } from '@archetype-themes/utils/events'

class HeaderSearch extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.boundDocumentClick = this.handleDocumentClick.bind(this)
    this.boundCloseAll = this.handleCloseAll.bind(this)
    document.addEventListener(EVENTS.headerSearchOpen, this.openInlineSearch.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  openInlineSearch(evt) {
    evt.preventDefault()
    evt.stopImmediatePropagation()
    this.classList.add('is-active')

    this.dispatchEvent(new CustomEvent(EVENTS.predictiveSearchOpen, { bubbles: true, detail: { context: 'header' } }))

    this.enableCloseListeners()
  }

  enableCloseListeners() {
    // Clicking out of search area closes it. Timeout to prevent immediate bubbling
    setTimeout(() => {
      document.addEventListener('click', this.boundDocumentClick, { signal: this.abortController.signal })
    }, 0)

    document.addEventListener('predictiveSearch:close-all', this.boundCloseAll, { signal: this.abortController.signal })
  }

  close(evt) {
    // If close button is clicked, close as expected.
    // Otherwise, ignore clicks in search results, search form, or container elements
    if (evt && evt.target.closest) {
      if (evt.target.closest('.site-header__element--sub')) {
        return
      } else if (evt.target.closest('#SearchResultsWrapper')) {
        return
      } else if (evt.target.closest('.site-header__search-container')) {
        return
      }
    }

    this.classList.remove('is-active')

    document.removeEventListener('click', this.boundDocumentClick)
    this.dispatchEvent(new CustomEvent(EVENTS.headerSearchClose, { bubbles: true }))
  }

  handleDocumentClick(evt) {
    this.close(evt)
  }

  handleCloseAll() {
    document.removeEventListener('predictiveSearch:close-all', this.boundCloseAll)
    this.close()
  }
}

customElements.define('header-search', HeaderSearch)
