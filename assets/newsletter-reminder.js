import Modals from '@archetype-themes/modules/modal'
import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'
import { setLocalStorage, getLocalStorage } from '@archetype-themes/utils/storage'

class NewsletterReminder extends HTMLThemeElement {
  constructor() {
    super()
    this.closeBtn = this.querySelector('[data-close-button]')
    this.popupTrigger = this.querySelector('[data-message]')

    this.newsletterId = `NewsletterPopup-${this.sectionId}`
    this.storageKey = `newsletter-${this.sectionId}`
    this.secondsBeforeShow = this.dataset.delaySeconds
    this.expiry = parseInt(this.dataset.delayDays)
    this.modal = new Modals(`NewsletterPopup-${this.newsletterId}`, 'newsletter-popup-modal')

    this.init()
  }

  connectedCallback() {
    super.connectedCallback()
    this.style.display = 'block'
  }

  init() {
    document.addEventListener(`modalOpen.${this.newsletterId}`, () => this.hide())
    document.addEventListener(`modalClose.${this.newsletterId}`, () => this.show())
    document.addEventListener(`newsletter:openReminder`, () => this.show(0))

    this.closeBtn.addEventListener('click', () => {
      this.hide()
      setLocalStorage(this.storageKey, 'opened', this.expiry)
    })

    this.popupTrigger.addEventListener('click', () => {
      const reminderOpen = new CustomEvent('reminder:openNewsletter', { bubbles: true })
      this.dispatchEvent(reminderOpen)
      this.hide()
    })

    this.checkAndShowReminder()
  }

  checkAndShowReminder() {
    const storedValue = getLocalStorage(this.storageKey)
    if (storedValue === 'opened' && !sessionStorage.getItem('reminderShownThisSession')) {
      this.show(this.secondsBeforeShow)
    }
  }

  show(time = 0, forceOpen = false) {
    if (forceOpen || !sessionStorage.getItem('reminderShownThisSession')) {
      setTimeout(() => {
        this.dataset.enabled = 'true'
        sessionStorage.setItem('reminderShownThisSession', 'true')
      }, time * 1000)
    }
  }

  hide() {
    this.dataset.enabled = 'false'
  }

  onBlockSelect() {
    this.show(0, true)
  }

  onBlockDeselect() {
    this.hide()
  }
}

customElements.define('newsletter-reminder', NewsletterReminder)
