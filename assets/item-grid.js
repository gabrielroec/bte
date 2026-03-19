import CollectionSidebar from '@archetype-themes/modules/collection-sidebar'
import AjaxRenderer from '@archetype-themes/utils/ajax-renderer'
import { debounce } from '@archetype-themes/utils/utils'
import { EVENTS } from '@archetype-themes/utils/events'

class ItemGrid extends HTMLElement {
  constructor() {
    super()
    this.isAnimating = false
    this.abortController = new AbortController()

    this.selectors = {
      sortSelect: '#SortBy',

      viewChange: '.grid-view-btn',
      productGrid: '.product-grid',

      collectionGrid: '.collection-grid__wrapper',
      sidebar: '#CollectionSidebar',
      activeTagList: '.tag-list--active-tags',
      tags: '.tag-list input',
      activeTags: '.tag-list a',
      tagsForm: '.filter-form',
      filterBar: '.collection-filter',
      priceRange: '.price-range',
      trigger: '.collapsible-trigger'
    }

    this.classes = {
      activeTag: 'tag--active',
      removeTagParent: 'tag--remove',
      collapsibleContent: 'collapsible-content',
      isOpen: 'is-open'
    }

    this.sectionId = this.getAttribute('data-section-id')
    this.ajaxRenderer = new AjaxRenderer({
      sections: [{ sectionId: this.sectionId, nodeId: 'AjaxContent' }],
      onReplace: this.onReplaceAjaxContent.bind(this)
    })

    this.isStickyHeader = false
  }

  connectedCallback() {
    this.abortController = new AbortController()
    this.init()

    if (document.querySelector('header[data-sticky="true"]')) {
      this.setFilterStickyPosition()
    }

    document.addEventListener(EVENTS.stickyHeaderChange, this.handleStickyHeaderChange.bind(this), {
      signal: this.abortController.signal
    })

    document.addEventListener(EVENTS.toggleMobileFilters, this.handleToggleMobileFilters.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()

    if (this.headerStickyChangeListener) {
      document.removeEventListener('headerStickyChange', this.headerStickyChangeListener)
    }

    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener)
    }
  }

  handleToggleMobileFilters(evt) {
    const { isOpen } = evt.detail

    if (isOpen) {
      document.dispatchEvent(
        new CustomEvent(EVENTS.sizeDrawer, {
          detail: { heights: [document.querySelector(this.selectors.filterBar).offsetHeight] }
        })
      )

      // Scroll to top of filter bar when opened
      let scrollTo = this.getScrollFilterTop()
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })
    }
  }

  init() {
    this.initSort()
    this.initFilters()
    this.initPriceRange()
    this.initGridOptions()

    this.sidebar = new CollectionSidebar()
  }

  handleStickyHeaderChange(evt) {
    this.isStickyHeader = evt.detail.isSticky

    if (this.isStickyHeader) {
      this.setFilterStickyPosition()
    }
  }

  initSort() {
    this.queryParams = new URLSearchParams(window.location.search)
    this.sortSelect = document.querySelector(this.selectors.sortSelect)

    if (this.sortSelect) {
      this.defaultSort = this.getDefaultSortValue()
      this.sortSelect.addEventListener(
        'change',
        () => {
          this.onSortChange()
        },
        { signal: this.abortController.signal }
      )
    }

    document.addEventListener(EVENTS.sortSelected, (evt) => {
      this.onSortChange(evt.detail.sortValue)
    })
  }

  getSortValue() {
    return this.sortSelect.value || this.defaultSort
  }

  getDefaultSortValue() {
    return this.sortSelect.getAttribute('data-default-sortby')
  }

  onSortChange(sortValue = null) {
    this.queryParams = new URLSearchParams(window.location.search)

    if (sortValue) {
      this.queryParams.set('sort_by', sortValue)
    } else {
      this.queryParams.set('sort_by', this.getSortValue())
    }

    this.queryParams.delete('page')
    window.location.search = this.queryParams.toString()
  }

  initGridOptions() {
    const grid = this.querySelector(this.selectors.productGrid)
    const viewBtns = this.querySelectorAll(this.selectors.viewChange)
    viewBtns.forEach((btn) => {
      btn.addEventListener(
        'click',
        () => {
          viewBtns.forEach((el) => {
            el.classList.remove('is-active')
          })
          btn.classList.add('is-active')
          const newView = btn.dataset.view
          grid.dataset.view = newView

          this.updateAttribute('product_view', newView)

          window.dispatchEvent(new Event('resize'))
        },
        { signal: this.abortController.signal }
      )
    })
  }

  updateAttribute(key, value) {
    return fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attributes: {
          [key]: value
        }
      })
    }).then((response) => {
      if (!response.ok) throw response
      return response.json()
    })
  }

  initFilters() {
    const filterBar = document.querySelectorAll(this.selectors.filterBar)

    if (!filterBar.length) {
      return
    }

    this.bindBackButton()

    this.dispatchEvent(new CustomEvent(EVENTS.headerStickyCheck), { bubbles: true })
    if (this.isStickyHeader) {
      this.setFilterStickyPosition()

      document.addEventListener('headerStickyChange', debounce(500, this.setFilterStickyPosition.bind(this)), {
        signal: this.abortController.signal
      })

      window.addEventListener('resize', debounce(500, this.setFilterStickyPosition.bind(this)), {
        signal: this.abortController.signal
      })
    }

    document.querySelectorAll(this.selectors.activeTags).forEach((tag) => {
      tag.addEventListener('click', this.onTagClick.bind(this), { signal: this.abortController.signal })
    })

    document.querySelectorAll(this.selectors.tagsForm).forEach((form) => {
      form.addEventListener('input', this.onFormSubmit.bind(this), { signal: this.abortController.signal })
    })
  }

  initPriceRange() {
    document.addEventListener('price-range:change', this.onPriceRangeChange.bind(this), {
      once: true,
      signal: this.abortController.signal
    })
  }

  onPriceRangeChange(event) {
    this.renderFromFormData(event.detail)
  }

  renderActiveTag(parent, el) {
    const textEl = parent.querySelector('.tag__text')

    if (parent.classList.contains(this.classes.activeTag)) {
      parent.classList.remove(this.classes.activeTag)
    } else {
      parent.classList.add(this.classes.activeTag)

      if (el.closest('li').classList.contains(this.classes.removeTagParent)) {
        parent.remove()
      } else {
        document.querySelectorAll(this.selectors.activeTagList).forEach((list) => {
          const newTag = document.createElement('li')
          const newTagLink = document.createElement('a')
          newTag.classList.add('tag', 'tag--remove')
          newTagLink.classList.add('btn', 'btn--small')
          newTagLink.innerText = textEl.innerText
          newTag.appendChild(newTagLink)

          list.appendChild(newTag)
        })
      }
    }
  }

  onTagClick(evt) {
    const el = evt.currentTarget

    this.dispatchEvent(new Event('filter:selected', { bubbles: true }))

    if (el.classList.contains('no-ajax')) {
      return
    }

    evt.preventDefault()
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    const parent = el.parentNode
    const newUrl = new URL(el.href)

    this.renderActiveTag(parent, el)
    this.updateScroll(true)
    this.startLoading()
    this.renderCollectionPage(newUrl.searchParams)
  }

  onFormSubmit(evt) {
    const el = evt.target

    this.dispatchEvent(new Event('filter:selected', { bubbles: true }))

    if (el.classList.contains('no-ajax')) {
      return
    }

    evt.preventDefault()
    if (this.isAnimating) {
      return
    }

    this.isAnimating = true

    const parent = el.closest('li')
    const formEl = el.closest('form')
    const formData = new FormData(formEl)

    this.renderActiveTag(parent, el)
    this.updateScroll(true)
    this.startLoading()
    this.renderFromFormData(formData)
  }

  onReplaceAjaxContent(newDom, section) {
    const openCollapsibleIds = this.fetchOpenCollapsibleFilters()

    openCollapsibleIds.forEach((selector) => {
      newDom.querySelectorAll(`[data-collapsible-id=${selector}]`).forEach(this.openCollapsible.bind(this))
    })

    const newContentEl = newDom.getElementById(section.nodeId)
    if (!newContentEl) {
      return
    }

    document.getElementById(section.nodeId).innerHTML = newContentEl.innerHTML

    const page = document.getElementById(section.nodeId)
    const countEl = page.querySelector('.collection-filter__item--count')
    if (countEl) {
      const count = countEl.innerText
      document.querySelectorAll('[data-collection-count]').forEach((el) => {
        el.innerText = count
      })
    }
  }

  renderFromFormData(formData) {
    const searchParams = new URLSearchParams(formData)
    this.renderCollectionPage(searchParams)
  }

  renderCollectionPage(searchParams, updateURLHash = true) {
    this.ajaxRenderer.renderPage(window.location.pathname, searchParams, updateURLHash).then(() => {
      this.init()
      this.updateScroll(false)

      this.dispatchEvent(new CustomEvent('collection:reloaded', { bubbles: true }))

      this.isAnimating = false
    })
  }

  updateScroll(animate) {
    let scrollTo = document.getElementById('AjaxContent').offsetTop

    // Scroll below the sticky header
    if (this.isStickyHeader) {
      scrollTo = scrollTo - document.querySelector('#SiteHeader').offsetHeight
    }

    if (!matchMedia('(max-width: 768px)').matches) {
      scrollTo -= 10
    }

    if (animate) {
      window.scrollTo({ top: scrollTo, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: scrollTo })
    }
  }

  bindBackButton() {
    window.removeEventListener('popstate', this._popStateHandler)
    this._popStateHandler = (state) => {
      if (state) {
        const newUrl = new URL(window.location.href)
        this.renderCollectionPage(newUrl.searchParams, false)
      }
    }

    window.addEventListener('popstate', this._popStateHandler, { signal: this.abortController.signal })
  }

  fetchOpenCollapsibleFilters() {
    const openDesktopCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.sidebar} ${this.selectors.trigger}.${this.classes.isOpen}`)
    )

    const openMobileCollapsible = Array.from(
      document.querySelectorAll(`${this.selectors.inlineWrapper} ${this.selectors.trigger}.${this.classes.isOpen}`)
    )

    return [...openDesktopCollapsible, ...openMobileCollapsible].map((trigger) => trigger.dataset.collapsibleId)
  }

  openCollapsible(el) {
    if (el.classList.contains(this.classes.collapsibleContent)) {
      el.style.height = 'auto'
    }

    el.classList.add(this.classes.isOpen)
  }

  setFilterStickyPosition() {
    const headerHeight = document.querySelector('.site-header').offsetHeight - 1
    document.querySelector(this.selectors.filterBar).style.top = headerHeight + 'px'

    // Also update top position of sticky sidebar
    const stickySidebar = this.querySelector('[data-sticky-sidebar]')
    if (stickySidebar) {
      stickySidebar.style.top = headerHeight + 30 + 'px'
    }
  }

  startLoading() {
    this.querySelector(this.selectors.collectionGrid).classList.add('unload')
  }

  forceReload() {
    this.init()
  }

  getScrollFilterTop() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop
    let elTop = document.querySelector(this.selectors.filterBar).getBoundingClientRect().top
    return elTop + scrollTop
  }
}

customElements.define('item-grid', ItemGrid)
