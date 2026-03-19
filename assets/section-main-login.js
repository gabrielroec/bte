class SectionMainLogin extends HTMLElement {
  connectedCallback() {
    this.checkUrlHash()
    this.initEventListeners()
    this.resetPasswordSuccess()
  }

  initEventListeners() {
    const recoverForm = document.getElementById('RecoverPassword')
    if (recoverForm) {
      recoverForm.addEventListener('click', (event) => {
        event.preventDefault()
        this.toggleRecoverPasswordForm()
      })
    }

    const hideRecoverPassword = document.getElementById('HideRecoverPasswordLink')
    if (hideRecoverPassword) {
      hideRecoverPassword.addEventListener('click', (event) => {
        event.preventDefault()
        this.toggleRecoverPasswordForm()
      })
    }
  }

  checkUrlHash() {
    const hash = window.location.hash

    if (hash === '#recover') {
      this.toggleRecoverPasswordForm()
    }
  }

  toggleRecoverPasswordForm() {
    const passwordForm = document.getElementById('RecoverPasswordForm').classList.toggle('hide')
    const loginForm = document.getElementById('CustomerLoginForm').classList.toggle('hide')
  }

  resetPasswordSuccess() {
    const formState = document.querySelector('.reset-password-success')

    if (!formState) {
      return
    }

    document.getElementById('ResetSuccess').classList.remove('hide')
  }
}

customElements.define('section-main-login', SectionMainLogin)
