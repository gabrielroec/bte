class CloneFooter extends HTMLElement {
  connectedCallback() {
    this.headerFooter = this.querySelector('#MobileNavFooter')
    this.footerMenus = document.querySelector('#FooterMenus')

    if (!this.headerFooter || !this.footerMenus) return
    if (matchMedia('(max-width: 768px)').matches) {
      this.cloneFooter()
    }
  }

  cloneFooter() {
    const clone = this.footerMenus.cloneNode(true)
    clone.id = ''

    // Append cloned footer menus to mobile nav
    this.headerFooter.appendChild(clone)

    // If localization form, update IDs so they don't match footer
    const localizationForm = this.headerFooter.querySelector('.multi-selectors')
    if (localizationForm) {
      // Loop disclosure buttons and update ids and aria attributes
      localizationForm.querySelectorAll('[data-disclosure-toggle]').forEach((el) => {
        const controls = el.getAttribute('aria-controls')
        const describedby = el.getAttribute('aria-describedby')

        el.setAttribute('aria-controls', controls + '-header')
        el.setAttribute('aria-describedby', describedby + '-header')

        const list = document.getElementById(controls)
        if (list) {
          list.id = controls + '-header'
        }

        const label = document.getElementById(describedby)
        if (label) {
          label.id = describedby + '-header'
        }
      })
    }
  }
}

customElements.define('clone-footer', CloneFooter)
