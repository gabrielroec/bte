import { hasLocalStorage } from '@archetype-themes/utils/storage'

let recentlyViewedIds = []

if (hasLocalStorage()) {
  const recentIds = localStorage.getItem('recently-viewed')

  if (recentIds && typeof recentIds !== undefined) {
    recentlyViewedIds = JSON.parse(recentIds)
  }
}

class RecentlyViewed extends HTMLElement {
  constructor() {
    super()

    this.initialized = false
    this.sectionId = this.getAttribute('data-section-id')
    this.maxProducts = this.getAttribute('data-max-products')

    this.init()
  }

  addIdToRecentlyViewed(id) {
    if (!id) return

    // Remove current product if already in recently viewed array
    if (recentlyViewedIds.includes(id)) {
      recentlyViewedIds.splice(recentlyViewedIds.indexOf(id), 1)
    }

    // Add id to array
    recentlyViewedIds.unshift(id)

    if (hasLocalStorage()) {
      localStorage.setItem('recently-viewed', JSON.stringify(recentlyViewedIds))
    }
  }

  init() {
    // Add current product to recently viewed
    this.addIdToRecentlyViewed(this.dataset.productId)

    if (this.initialized) {
      return
    }

    this.initialized = true

    // Stop if no data
    if (!recentlyViewedIds.length) {
      this.classList.add('hide')
      return
    }

    this.outputContainer = this.querySelector(`#RecentlyViewed-${this.sectionId}`)
    const currentId = this.getAttribute('data-product-id')

    let url = `${window.Shopify.routes.root}search?view=recently-viewed&type=product&q=`

    let products = ''
    let i = 0
    recentlyViewedIds.forEach((val) => {
      // Skip current product
      if (val === currentId) {
        return
      }

      // Stop at max
      if (i >= this.maxProducts) {
        return
      }

      products += `id:${val} OR `
      i++
    })

    url = url + encodeURIComponent(products)

    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div')
        html.innerHTML = text
        const count = html.querySelectorAll('.grid-product').length

        if (count > 0) {
          const results = html.querySelector('.product-grid')
          this.outputContainer.append(results)
        } else {
          this.classList.add('hide')
        }
      })
      .catch((e) => {
        console.error(e)
      })
  }

  disconnectedCallback() {
    this.initialized = false
  }
}

customElements.define('recently-viewed', RecentlyViewed)
