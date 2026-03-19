import { EVENTS } from '@archetype-themes/utils/events'

let selectors = {
  nav: '.slide-nav',
  childList: '.slide-nav__dropdown',
  allLinks: 'a.slide-nav__link',
  subNavToggleBtn: '.js-toggle-submenu'
}

let classes = {
  isActive: 'is-active'
}

let defaults = {
  menuLevel: 1,
  inHeader: false
}

/*============================================================================
  MobileNav has two uses:
  - Dropdown from header on small screens
  - Duplicated into footer, initialized as separate entity in HeaderSection
==============================================================================*/
class MobileNav extends HTMLElement {
  constructor() {
    super()

    this.config = Object.assign({}, defaults)
    this.config.inHeader = this.getAttribute('inHeader') === 'true'
  }

  connectedCallback() {
    this.abortController = new AbortController()
    this.nav = this.querySelector(selectors.nav)

    this.init()
  }

  init() {
    // Toggle between menu levels
    this.nav.querySelectorAll(selectors.subNavToggleBtn).forEach((btn) => {
      btn.addEventListener('click', this.toggleSubNav.bind(this), { signal: this.abortController.signal })
    })

    // Close nav when a normal link is clicked
    this.nav.querySelectorAll(selectors.allLinks).forEach((link) => {
      this.dispatchEvent(new CustomEvent(EVENTS.mobileNavClose, { bubbles: true }))
    })
  }

  /*============================================================================
    Handle switching between nav levels
  ==============================================================================*/
  toggleSubNav(evt) {
    let btn = evt.currentTarget
    this.goToSubnav(btn.dataset.target)
  }

  // If a level is sent we are going up, so target list doesn't matter
  goToSubnav(target) {
    // Activate new list if a target is passed
    let targetMenu = this.nav.querySelector(selectors.childList + '[data-parent="' + target + '"]')
    if (targetMenu) {
      this.config.menuLevel = targetMenu.dataset.level

      // Hide all level 3 menus if going to level 2
      if (this.config.menuLevel == 2) {
        this.nav.querySelectorAll(selectors.childList + '[data-level="3"]').forEach((list) => {
          list.classList.remove(classes.isActive)
        })
      }

      targetMenu.classList.add(classes.isActive)
      this.setWrapperHeight(targetMenu.offsetHeight)
    } else {
      // Going to top level, reset
      this.config.menuLevel = 1
      this.removeAttribute('style')
      this.nav.querySelectorAll(selectors.childList).forEach((list) => {
        list.classList.remove(classes.isActive)
      })
    }

    this.dataset.level = this.config.menuLevel
  }

  setWrapperHeight(h) {
    this.style.height = h + 'px'
  }
}

customElements.define('mobile-nav', MobileNav)
