import { EVENTS } from '@archetype-themes/utils/events'
import { unlockMobileScrolling } from '@archetype-themes/utils/a11y'

let selectors = {
  sidebarId: 'CollectionSidebar',
  trigger: '.collection-filter__btn'
}

let config = {
  isOpen: false,
  namespace: '.collection-filters'
}

export default class CollectionSidebar {
  constructor() {
    // Do not load when no sidebar exists
    if (!document.getElementById(selectors.sidebarId)) {
      return
    }

    this.init()
  }

  init() {
    config.isOpen = false
    unlockMobileScrolling()

    // This function runs on page load, and when the collection section loads
    // so we need to be mindful of not duplicating event listeners
    this.trigger = document.querySelector(selectors.trigger)

    this.trigger.removeEventListener('click', this._handleClick)
    this._handleClick = this.handleClick.bind(this)
    this.trigger.addEventListener('click', this._handleClick)
  }

  handleClick() {
    this.isOpen = !this.isOpen
    this.trigger.classList.toggle('is-active', this.isOpen)
    document.dispatchEvent(new CustomEvent(EVENTS.toggleMobileFilters, { detail: { isOpen: this.isOpen } }))
  }
}
