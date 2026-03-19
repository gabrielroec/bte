import { executeJSmodules } from '@archetype-themes/utils/utils'

class BackgroundImage extends HTMLElement {
  connectedCallback() {
    const element = this.querySelector('[data-section-type="background-image"]')

    element.classList.remove('loading', 'loading--delayed')
    element.classList.add('loaded')

    if (Shopify.designMode && element.hasAttribute('data-parallax')) {
      requestAnimationFrame(() => {
        const scripts = this.querySelectorAll('script[type="module"]')
        if (scripts.length) {
          executeJSmodules(scripts)
        }
      })
    }
  }
}

customElements.define('background-image', BackgroundImage)
