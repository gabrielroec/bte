import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'

class Toolbar extends HTMLThemeElement {
  constructor() {
    super()
    /**
     * @event toolbar:loaded
     * @description Fired when the toolbar section has been loaded.
     * @param {string} detail.sectionId - The section's ID.
     */
    document.dispatchEvent(
      new CustomEvent('toolbar:loaded', {
        detail: {
          sectionId: this.sectionId
        }
      })
    )
  }

  connectedCallback() {
    super.connectedCallback()
  }
}

customElements.define('toolbar-section', Toolbar)
