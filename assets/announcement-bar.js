import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'
import { Slideshow } from '@archetype-themes/modules/slideshow'

class AnnouncementBar extends HTMLThemeElement {
  connectedCallback() {
    super.connectedCallback()
    this.section = this.closest('.shopify-section')
    this.sectionHeight = this.section.offsetHeight

    if (parseInt(this.dataset.blockCount) === 1) {
      return
    }

    const args = {
      autoPlay: 5000,
      avoidReflow: true,
      cellAlign: document.documentElement.dir === 'rtl' ? 'right' : 'left',
      fade: true
    }

    this.flickity = new Slideshow(this, args)
    document.documentElement.style.setProperty('--announcement-bar-height', this.sectionHeight + 'px')
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }

  // Go to slide if selected in the editor
  onBlockSelect({ detail: { blockId } }) {
    const slide = this.querySelector('#AnnouncementSlide-' + blockId)
    const index = parseInt(slide.dataset.index)

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

customElements.define('announcement-bar', AnnouncementBar)
