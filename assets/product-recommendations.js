import { Slideshow } from '@archetype-themes/modules/slideshow'

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    this.el = this
    this.url = this.dataset.url
    this.intent = this.dataset.intent
    this.placeholder = this.querySelector('.product-recommendations-placeholder')
    this.productResults = this.querySelector('.grid-product')
    this.sectionId = this.dataset.sectionId
    this.blockId = this.dataset.blockId

    fetch(this.url)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement('div')
        html.innerHTML = text
        const recommendations = html.querySelector('.product-recommendations')

        if (!recommendations) {
          this.el.classList.add('hide')
          return
        }

        this.placeholder.innerHTML = ''
        this.placeholder.innerHTML = recommendations.innerHTML

        this.slideshow = this.querySelector('[data-slideshow]')

        if (this.slideshow) {
          this.setupSlider()
        }
      })
      .catch((e) => {
        console.error(e)
      })
  }

  setupSlider() {
    const controlType = this.slideshow.dataset.controls
    const perSlide = parseFloat(this.slideshow.dataset.perSlide)
    const count = parseFloat(this.slideshow.dataset.count)

    let prevNextButtons = false
    let pageDots = true

    if (controlType === 'arrows') {
      pageDots = false
      prevNextButtons = true
    }

    if (perSlide < count) {
      this.flickity = new Slideshow(this.slideshow, {
        prevNextButtons,
        pageDots,
        adaptiveHeight: true,
        wrapAround: false
      })
    }
  }
}

customElements.define('product-recommendations', ProductRecommendations)
