import { Slideshow } from '@archetype-themes/modules/slideshow'
import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'

class Testimonials extends HTMLThemeElement {
  connectedCallback() {
    super.connectedCallback()

    this.defaults = {
      adaptiveHeight: true,
      avoidReflow: true,
      pageDots: true,
      prevNextButtons: false
    }

    this.timeout
    this.slideshow = this.querySelector(`#Testimonials-${this.sectionId}`)
    this.namespace = `.testimonial-${this.sectionId}`

    if (!this.slideshow) {
      return
    }

    this.init()
  }

  init() {
    // Do not wrap when only a few blocks
    if (this.slideshow.dataset.count <= 3) {
      this.defaults.wrapAround = false
    }

    this.flickity = new Slideshow(this.slideshow, this.defaults)

    // Autoscroll to next slide on load to indicate more blocks
    if (this.slideshow.dataset.count > 2) {
      this.timeout = setTimeout(
        function () {
          this.flickity.goToSlide(1)
        }.bind(this),
        1000
      )
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }

  onSectionDeselect() {
    if (this.flickity && typeof this.flickity.play === 'function') {
      this.flickity.play()
    }
  }

  onBlockSelect({ detail: { blockId } }) {
    const slide = this.slideshow.querySelector(`.testimonials-slide--${blockId}`)
    const index = parseInt(slide.dataset.index)

    clearTimeout(this.timeout)

    if (this.flickity && typeof this.flickity.pause === 'function') {
      this.flickity.goToSlide(index)
      this.flickity.pause()
    }
  }

  onBlockDeselect() {
    if (this.flickity && typeof this.flickity.play === 'function') {
      this.flickity.play()
    }
  }
}

customElements.define('testimonials-component', Testimonials)
