import { EVENTS } from '@archetype-themes/utils/events'
import { debounce } from '@archetype-themes/utils/utils'

class PredictiveSearch extends HTMLElement {
  constructor() {
    super()
    this.enabled = this.getAttribute('data-enabled')
    this.context = this.getAttribute('data-context')
    this.input = this.querySelector('input[type="search"]')
    this.predictiveSearchResults = this.querySelector('#predictive-search')
    this.closeBtn = this.querySelector('.btn--close-search')
    this.screen = this.querySelector('[data-screen]')
    this.SearchModal = this.closest('#SearchModal') || null

    // listen for class change of 'modal--is-active on this.SearchModal
    if (this.SearchModal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const modalClass = mutation.target.className
            if (modalClass.indexOf('modal--is-active') > -1) {
              setTimeout(() => {
                this.input.focus()
              }, 100)
            }
          }
        })
      })

      observer.observe(this.SearchModal, {
        attributes: true
      })
    }
  }

  connectedCallback() {
    if (this.enabled === 'false') return

    this.abortController = new AbortController()

    // Open events
    document.addEventListener(
      EVENTS.predictiveSearchOpen,
      (e) => {
        if (e.detail.context !== this.context) return
        this.classList.add('is-active')

        // Wait for opening events to finish then apply focus
        setTimeout(() => {
          this.input.focus()
        }, 100)

        document.body.classList.add('predictive-overflow-hidden')
      },
      { signal: this.abortController.signal }
    )

    // On typing
    this.input.addEventListener('keydown', () => {
      this.classList.add('is-active')
    })

    this.input.addEventListener(
      'input',
      debounce(300, (event) => {
        this.onChange(event)
      }).bind(this)
    )

    // Close events
    document.addEventListener(
      EVENTS.predictiveSearchClose,
      () => {
        this.close()
      },
      { signal: this.abortController.signal }
    )

    document.addEventListener(
      'keydown',
      (evt) => {
        if (evt.keyCode === 27) this.close()
      },
      { signal: this.abortController.signal }
    )

    this.closeBtn.addEventListener(
      'click',
      (evt) => {
        evt.preventDefault()
        this.close()
      },
      { signal: this.abortController.signal }
    )

    this.screen?.addEventListener(
      'click',
      () => {
        this.close()
      },
      { signal: this.abortController.signal }
    )

    document.addEventListener(EVENTS.headerSearchClose, () => {
      this.close()
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  onChange() {
    const searchTerm = this.input.value.trim()
    if (!searchTerm.length) return

    this.getSearchResults(searchTerm)
  }

  getSearchResults(searchTerm) {
    const searchObj = {
      q: searchTerm,
      'resources[limit]': 3,
      'resources[limit_scope]': 'each',
      'resources[options][unavailable_products]': 'last'
    }

    const params = this.paramUrl(searchObj)

    fetch(`${window.Shopify.routes.root}search/suggest?${params}&section_id=search-results`)
      .then((response) => {
        if (!response.ok) {
          const error = new Error(response.status)
          this.close()
          throw error
        }

        return response.text()
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-search-results').innerHTML
        this.predictiveSearchResults.innerHTML = resultsMarkup
        this.open()
      })
      .catch((error) => {
        this.close()
        throw error
      })
  }

  open() {
    this.predictiveSearchResults.style.display = 'block'
  }

  close() {
    this.predictiveSearchResults.style.display = 'none'
    this.predictiveSearchResults.innerHTML = ''
    this.classList.remove('is-active')
    document.body.classList.remove('predictive-overflow-hidden')
    if (this.contains(document.activeElement)) document.activeElement.blur()

    /**
     * @event predictive-search:close-all
     * @description Fired when the predictive search is closed.
     */
    this.dispatchEvent(new CustomEvent(EVENTS.predictiveSearchCloseAll, { bubbles: true }))
  }

  paramUrl(obj) {
    return Object.keys(obj)
      .map(function (key) {
        return key + '=' + encodeURIComponent(obj[key])
      })
      .join('&')
  }
}

customElements.define('predictive-search', PredictiveSearch)
