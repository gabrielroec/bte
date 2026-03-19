import Modals from '@archetype-themes/modules/modal'
import { lockMobileScrolling, unlockMobileScrolling } from '@archetype-themes/utils/a11y'
import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'
import { setLocalStorage, getLocalStorage } from '@archetype-themes/utils/storage'

class AgeVerificationPopup extends HTMLThemeElement {
  connectedCallback() {
    this.storageKey = this.id
    this.storageValue = getLocalStorage(this.storageKey)

    this.classes = {
      activeContent: 'age-verification-popup__content--active',
      inactiveContent: 'age-verification-popup__content--inactive',
      inactiveDeclineContent: 'age-verification-popup__decline-content--inactive',
      activeDeclineContent: 'age-verification-popup__decline-content--active'
    }

    this.declineButton = this.querySelector('[data-age-verification-popup-decline-button]')
    this.declineContent = this.querySelector('[data-age-verification-popup-decline-content]')
    this.content = this.querySelector('[data-age-verification-popup-content]')
    this.returnButton = this.querySelector('[data-age-verification-popup-return-button]')
    this.exitButton = this.querySelector('[data-age-verification-popup-exit-button]')
    this.backgroundImage = this.querySelector('[data-background-image]')
    this.mobileBackgroundImage = this.querySelector('[data-mobile-background-image]')

    // Age verification popup will only be hidden if test mode is disabled AND
    // either a local storage value exists OR visibility is toggled in the editor
    if (this.storageValue && this.dataset.testMode === 'false') return

    this.init()
  }

  init() {
    this.modal = new Modals(this.id, 'age-verification-popup-modal', {
      closeOffContentClick: false
    })

    if (this.backgroundImage) {
      this.backgroundImage.style.display = 'block'
    }

    if (matchMedia('(max-width: 768px)').matches && this.mobileBackgroundImage) {
      this.mobileBackgroundImage.style.display = 'block'
    }

    this.modal.open()

    lockMobileScrolling(document.querySelector('#MainContent'))

    if (this.declineButton) {
      this.declineButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.showDeclineContent()

        // If in editor, save to session storage to indicate that user has moved on to the second view
        // Allows view to persist while making changes in the editor
        if (Shopify.designMode) {
          sessionStorage.setItem(this.id, 'second-view')
        }
      })
    }

    if (this.returnButton) {
      this.returnButton.addEventListener('click', (e) => {
        e.preventDefault()
        this.hideDeclineContent()

        // Remove data from session storage so second view doesn't persist
        const secondViewVisited = sessionStorage.getItem(this.id)

        if (Shopify.designMode && secondViewVisited) {
          sessionStorage.removeItem(this.id)
        }
      })
    }

    if (this.exitButton) {
      this.exitButton.addEventListener('click', (e) => {
        e.preventDefault()

        // We don't want to set the local storage if we're in test mode
        if (this.dataset.testMode === 'false') {
          setLocalStorage(this.storageKey, 'entered', 30)
        }

        if (this.backgroundImage) {
          this.backgroundImage.style.display = 'none'
        }

        if (matchMedia('(max-width: 768px)').matches && this.mobileBackgroundImage) {
          this.mobileBackgroundImage.style.display = 'none'
        }

        this.modal.close()

        unlockMobileScrolling(document.querySelector('#MainContent'))
      })
    }
  }

  showDeclineContent() {
    this.declineContent.classList.remove(this.classes.inactiveDeclineContent)
    this.declineContent.classList.add(this.classes.activeDeclineContent)

    this.content.classList.add(this.classes.inactiveContent)
    this.content.classList.remove(this.classes.activeContent)
  }

  hideDeclineContent() {
    this.declineContent.classList.add(this.classes.inactiveDeclineContent)
    this.declineContent.classList.remove(this.classes.activeDeclineContent)

    this.content.classList.remove(this.classes.inactiveContent)
    this.content.classList.add(this.classes.activeContent)
  }

  onSectionLoad() {
    this.init()

    // If 'Test mode' is enabled, remove the local storage item we've set
    if (this.dataset.testMode === 'true' && this.storageValue) {
      localStorage.removeItem(this.storageKey)
    }

    // Check session storage if user was editing on the second view
    const secondViewVisited = sessionStorage.getItem(this.id)

    if (!secondViewVisited) return

    this.showDeclineContent()
  }

  onSectionUnload() {
    this.modal.close()
  }

  onSectionSelect() {
    this.init()
  }
}

customElements.define('age-verification-popup', AgeVerificationPopup)
