import Modals from '@archetype-themes/modules/modal'

class PasswordHeader extends HTMLElement {
  constructor() {
    super()
    this.sectionId = this.getAttribute('data-section-id')

    if (!document.querySelector('#LoginModal')) return

    const passwordModal = new Modals('LoginModal', 'login-modal', {
      focusIdOnOpen: 'password',
      solid: true
    })

    // Open modal if errors exist
    if (document.querySelectorAll('.errors').length) passwordModal.open()
  }
}

customElements.define('password-header', PasswordHeader)
