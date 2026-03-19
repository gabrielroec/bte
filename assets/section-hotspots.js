import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'

class HotSpots extends HTMLThemeElement {
  connectedCallback() {
    this.el = this
    this.buttons = this.querySelectorAll('[data-button]')
    this.hotspotBlocks = this.querySelectorAll('[data-hotspot-block]')
    this.blockContainer = this.querySelector('[data-block-container]')

    this._bindEvents()
  }

  _bindEvents() {
    this.buttons.forEach((button) => {
      const id = button.dataset.button

      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this._showContent(id)
      })
    })
  }

  _showContent(id) {
    this.hotspotBlocks.forEach((block) => {
      if (block.dataset.hotspotBlock === id) {
        block.classList.add('is-active')
      } else {
        block.classList.remove('is-active')
      }
    })
  }

  onBlockSelect({ detail: { blockId } }) {
    this._showContent(blockId)
  }
}

customElements.define('hot-spots', HotSpots)
