import Modals from '@archetype-themes/modules/modal'
import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'
import { setLocalStorage, getLocalStorage } from '@archetype-themes/utils/storage'

class NewsletterPopup extends HTMLThemeElement {
  constructor() {
    super()
    this.storageKey = 'newsletter-' + this.sectionId
  }

  connectedCallback() {
    super.connectedCallback()

    if (!this) return
    // Prevent popup on Shopify robot challenge page
    if (window.location.pathname === '/challenge') return
    // Prevent popup on password page
    if (window.location.pathname === '/password') return

    this.data = {
      secondsBeforeShow: this.dataset.delaySeconds,
      daysBeforeReappear: this.dataset.delayDays,
      hasReminder: this.dataset.hasReminder,
      testMode: this.dataset.testMode
    }

    this.modal = new Modals('NewsletterPopup-' + this.sectionId, 'newsletter-popup-modal', {
      trapFocus: !Shopify.designMode
    })

    // Set storage if optional button is clicked
    const btn = this.querySelector('.popup-cta a')
    if (btn) {
      btn.addEventListener('click', () => this.closePopup(true))
    }

    // Open modal if errors or success message exist
    if (this.querySelector('.errors') || this.querySelector('.note--success')) {
      this.modal.open()
    }

    // Set storage as opened if success message
    if (this.querySelector('.note--success')) {
      this.closePopup(true)
      return
    }

    document.addEventListener('modalClose.' + this.id, () => this.closePopup())

    this.checkAndInitPopup()

    document.addEventListener('reminder:openNewsletter', () => {
      this.modal.open()
    })
  }

  checkAndInitPopup() {
    const storageValue = getLocalStorage(this.storageKey)
    if (!storageValue && !sessionStorage.getItem('popupShownThisSession')) {
      this.initPopupDelay()
    }
  }

  onSectionSelect() {
    this.modal.open()
  }

  onSectionDeselect() {
    this.modal.close()
  }

  onBlockDeselect() {
    this.modal.close()
  }

  initPopupDelay() {
    if (this.data.testMode === 'true') {
      return
    }
    setTimeout(() => {
      this.modal.open()
      sessionStorage.setItem('popupShownThisSession', 'true')
    }, this.data.secondsBeforeShow * 1000)
  }

  closePopup(success) {
    // Remove storage in case it was set in test mode
    if (this.data.testMode === 'true') {
      localStorage.removeItem(this.storageKey)
      sessionStorage.removeItem('popupShownThisSession')
      return
    }

    const expires = success ? 200 : this.data.daysBeforeReappear
    setLocalStorage(this.storageKey, 'opened', expires)
  }
}

customElements.define('newsletter-popup', NewsletterPopup)
