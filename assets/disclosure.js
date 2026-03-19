let selectors = {
  disclosureForm: '[data-disclosure-form]',
  disclosureList: '[data-disclosure-list]',
  disclosureToggle: '[data-disclosure-toggle]',
  disclosureInput: '[data-disclosure-input]',
  disclosureOptions: '[data-disclosure-option]'
}

let classes = {
  listVisible: 'disclosure-list--visible'
}

// Shopify-built select-like popovers for currency and language selection
class Disclosure extends HTMLElement {
  connectedCallback() {
    this.container = this
    this._cacheSelectors()
    this._setupListeners()
  }

  disconnectedCallback() {
    this.destroy()
  }

  _cacheSelectors() {
    this.cache = {
      disclosureForm: this.container.closest(selectors.disclosureForm),
      disclosureList: this.container.querySelector(selectors.disclosureList),
      disclosureToggle: this.container.querySelector(selectors.disclosureToggle),
      disclosureInput: this.container.querySelector(selectors.disclosureInput),
      disclosureOptions: this.container.querySelectorAll(selectors.disclosureOptions)
    }
  }

  _setupListeners() {
    this.eventHandlers = this._setupEventHandlers()

    this.cache.disclosureToggle.addEventListener('click', this.eventHandlers.toggleList)

    this.cache.disclosureOptions.forEach(function (disclosureOption) {
      disclosureOption.addEventListener('click', this.eventHandlers.connectOptions)
    }, this)

    this.container.addEventListener('keyup', this.eventHandlers.onDisclosureKeyUp)

    this.cache.disclosureList.addEventListener('focusout', this.eventHandlers.onDisclosureListFocusOut)

    this.cache.disclosureToggle.addEventListener('focusout', this.eventHandlers.onDisclosureToggleFocusOut)

    document.body.addEventListener('click', this.eventHandlers.onBodyClick)
  }

  _setupEventHandlers() {
    return {
      connectOptions: this._connectOptions.bind(this),
      toggleList: this._toggleList.bind(this),
      onBodyClick: this._onBodyClick.bind(this),
      onDisclosureKeyUp: this._onDisclosureKeyUp.bind(this),
      onDisclosureListFocusOut: this._onDisclosureListFocusOut.bind(this),
      onDisclosureToggleFocusOut: this._onDisclosureToggleFocusOut.bind(this)
    }
  }

  _connectOptions(event) {
    event.preventDefault()

    this._submitForm(event.currentTarget.dataset.value)
  }

  _onDisclosureToggleFocusOut(event) {
    let disclosureLostFocus = this.container.contains(event.relatedTarget) === false

    if (disclosureLostFocus) {
      this._hideList()
    }
  }

  _onDisclosureListFocusOut(event) {
    let childInFocus = event.currentTarget.contains(event.relatedTarget)

    let isVisible = this.cache.disclosureList.classList.contains(classes.listVisible)

    if (isVisible && !childInFocus) {
      this._hideList()
    }
  }

  _onDisclosureKeyUp(event) {
    if (event.which !== 27) return
    this._hideList()
    this.cache.disclosureToggle.focus()
  }

  _onBodyClick(event) {
    let isOption = this.container.contains(event.target)
    let isVisible = this.cache.disclosureList.classList.contains(classes.listVisible)

    if (isVisible && !isOption) {
      this._hideList()
    }
  }

  _submitForm(value) {
    this.cache.disclosureInput.value = value
    this.cache.disclosureForm.submit()
  }

  _hideList() {
    this.cache.disclosureList.classList.remove(classes.listVisible)
    this.cache.disclosureToggle.setAttribute('aria-expanded', false)
  }

  _toggleList() {
    let ariaExpanded = this.cache.disclosureToggle.getAttribute('aria-expanded') === 'true'
    this.cache.disclosureList.classList.toggle(classes.listVisible)
    this.cache.disclosureToggle.setAttribute('aria-expanded', !ariaExpanded)
  }

  destroy() {
    this.cache.disclosureToggle.removeEventListener('click', this.eventHandlers.toggleList)

    this.cache.disclosureOptions.forEach(function (disclosureOption) {
      disclosureOption.removeEventListener('click', this.eventHandlers.connectOptions)
    }, this)

    this.container.removeEventListener('keyup', this.eventHandlers.onDisclosureKeyUp)

    this.cache.disclosureList.removeEventListener('focusout', this.eventHandlers.onDisclosureListFocusOut)

    this.cache.disclosureToggle.removeEventListener('focusout', this.eventHandlers.onDisclosureToggleFocusOut)

    document.body.removeEventListener('click', this.eventHandlers.onBodyClick)
  }
}

customElements.define('at-disclosure', Disclosure)
