import { prepareTransition, debounce } from '@archetype-themes/utils/utils'
import { EVENTS } from '@archetype-themes/utils/events'

let selectors = {
  wrapper: '#HeaderWrapper',
  siteHeader: '#SiteHeader',
  megamenu: '.megamenu',
  triggerCollapsedMenu: '.site-nav__compress-menu',
  collapsedMenu: '[data-type="nav"]',
  bottomSearch: '[data-type="search"]',
  navDetails: '.site-nav__details'
}

let classes = {
  headerCompressed: 'header-wrapper--compressed',
  overlay: 'header-wrapper--overlay',
  overlayStyle: 'is-light'
}

let config = {
  wrapperOverlayed: false,
  stickyEnabled: false,
  stickyActive: false,
  subarPositionInit: false,
  threshold: 0
}

// Elements used in resize functions, defined in init
let wrapper
let siteHeader
let bottomNav
let bottomSearch

class HeaderNav extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()

    wrapper = document.querySelector(selectors.wrapper)
    siteHeader = document.querySelector(selectors.siteHeader)
    bottomNav = wrapper.querySelector(selectors.collapsedMenu)
    bottomSearch = wrapper.querySelector(selectors.bottomSearch)
    this.isStickyHeader = false

    // Trigger collapsed state at top of header
    config.threshold = wrapper.getBoundingClientRect().bottom

    config.subarPositionInit = false
    config.stickyEnabled = siteHeader.dataset.sticky === 'true'

    if (config.stickyEnabled) {
      config.wrapperOverlayed = wrapper.classList.contains(classes.overlayStyle)
      this.stickyHeaderCheck()
    } else {
      this.disableSticky()
    }

    this.overlayHeader = siteHeader.dataset.overlay === 'true'

    // Disable overlay header if on collection template with no collection image
    if (this.overlayHeader && Shopify && Shopify.designMode) {
      if (document.body.classList.contains('template-collection') && !document.querySelector('.collection-hero')) {
        this.disableOverlayHeader()
      }
    }

    this.initOverlayHeaderAdmin()

    // Position menu and search bars absolutely, offsetting their height
    // with an invisible div to prevent reflows
    this.setAbsoluteBottom()
    window.addEventListener('resize', debounce(250, this.setAbsoluteBottom), { signal: this.abortController.signal })

    let collapsedNavTrigger = wrapper.querySelector(selectors.triggerCollapsedMenu)
    if (collapsedNavTrigger && !collapsedNavTrigger.classList.contains('nav-trigger--initialized')) {
      collapsedNavTrigger.classList.add('nav-trigger--initialized')
      collapsedNavTrigger.addEventListener(
        'click',
        function (e) {
          collapsedNavTrigger.classList.toggle('is-active')
          prepareTransition(bottomNav, function () {
            bottomNav.classList.toggle('is-active')
          })
        },
        { signal: this.abortController.signal }
      )
    }

    // Subscribe to sticky header check
    document.addEventListener(EVENTS.headerStickyCheck, this.stickyHeaderCheck.bind(this), {
      signal: this.abortController.signal
    })

    // Subscribe to overlay header disable
    document.addEventListener(EVENTS.headerOverlayDisable, this.disableOverlayHeader, {
      signal: this.abortController.signal
    })

    // Subscribe to overlay header remove class
    document.addEventListener(EVENTS.headerOverlayRemoveClass, this.removeOverlayClass, {
      signal: this.abortController.signal
    })

    // Subscribe to drawer size
    document.addEventListener(EVENTS.sizeDrawer, this.sizeDrawer.bind(this), { signal: this.abortController.signal })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  initOverlayHeaderAdmin() {
    if (!Shopify.designMode) {
      return
    }
    const section = this.closest('.shopify-section-group-header-group')
    const index = Array.from(section.parentElement.children).indexOf(section) + 1
    if (index === 2 && this.overlayHeader) {
      siteHeader.setAttribute('data-section-index', index)
      config.wrapperOverlayed = true
      this.classList.add(classes.overlay, classes.overlayStyle)
    }
  }

  // Measure sub menu bar, set site header's bottom padding to it.
  // Set sub bars as absolute to avoid page jumping on collapsed state change.
  setAbsoluteBottom() {
    if (this.overlayHeader) {
      document.querySelector('.header-section').classList.add('header-section--overlay')
    }

    let activeSubBar = matchMedia('(max-width: 768px)').matches
      ? document.querySelector('.site-header__element--sub[data-type="search"]')
      : document.querySelector('.site-header__element--sub[data-type="nav"]')

    if (activeSubBar) {
      let h = activeSubBar.offsetHeight
      // If height is 0, it was measured when hidden so ignore it.
      // Very likely it's on mobile when the address bar is being
      // hidden and triggers a resize
      if (h !== 0) {
        document.documentElement.style.setProperty('--header-padding-bottom', h + 'px')
      }

      // If not setup before, set active class on wrapper so subbars become absolute
      if (!config.subarPositionInit) {
        wrapper.classList.add('header-wrapper--init')
        config.subarPositionInit = true
      }
    }
  }

  // If the header setting to overlay the menu on the collection image
  // is enabled but the collection setting is disabled, we need to undo
  // the init of the sticky nav
  disableOverlayHeader() {
    wrapper.classList.remove(config.overlayEnabledClass, classes.overlayStyle)
    config.wrapperOverlayed = false

    document.dispatchEvent(
      new CustomEvent(EVENTS.overlayHeaderChange, {
        detail: {
          overlayHeader: false
        }
      })
    )
  }

  stickyHeaderCheck() {
    // Disable sticky header if any mega menu is taller than window
    this.isStickyHeader = this.doesMegaMenuFit()

    if (this.isStickyHeader) {
      config.forceStopSticky = false
      this.stickyHeader()
      document.dispatchEvent(new CustomEvent(EVENTS.stickyHeaderChange, { detail: { isSticky: true } }))
    } else {
      config.forceStopSticky = true
      this.disableSticky()
      document.dispatchEvent(new CustomEvent(EVENTS.stickyHeaderChange, { detail: { isSticky: false } }))
    }
  }

  disableSticky() {
    document.querySelector('.header-section').style.position = 'relative'
  }

  removeOverlayClass() {
    if (config.wrapperOverlayed) {
      wrapper.classList.remove(classes.overlayStyle)
    }
  }

  doesMegaMenuFit() {
    let largestMegaNav = 0
    const header = siteHeader || document.querySelector(selectors.siteHeader)
    header.querySelectorAll(selectors.megamenu).forEach((nav) => {
      let h = nav.offsetHeight
      if (h > largestMegaNav) {
        largestMegaNav = h
      }
    })

    // 120 ~ space of visible header when megamenu open
    if (window.innerHeight < largestMegaNav + 120) {
      return false
    }

    return true
  }

  stickyHeader() {
    if (window.scrollY > config.threshold) {
      this.stickyHeaderScroll()
    }

    window.addEventListener('scroll', this.stickyHeaderScroll.bind(this), { signal: this.abortController.signal })
  }

  stickyHeaderScroll() {
    if (!config.stickyEnabled) {
      return
    }

    if (config.forceStopSticky) {
      return
    }

    requestAnimationFrame(this.scrollHandler)
  }

  scrollHandler() {
    if (window.scrollY > config.threshold) {
      if (config.stickyActive) {
        return
      }

      if (bottomNav) {
        prepareTransition(bottomNav)
      }
      if (bottomSearch) {
        prepareTransition(bottomSearch)
      }

      config.stickyActive = true

      wrapper.classList.add(classes.headerCompressed)

      if (config.wrapperOverlayed) {
        wrapper.classList.remove(classes.overlayStyle)
      }

      document.dispatchEvent(new CustomEvent('headerStickyChange'))
    } else {
      if (!config.stickyActive) {
        return
      }

      if (bottomNav) {
        prepareTransition(bottomNav)
      }
      if (bottomSearch) {
        prepareTransition(bottomSearch)
      }

      config.stickyActive = false

      // Update threshold in case page was loaded down the screen
      config.threshold = wrapper.getBoundingClientRect().bottom

      wrapper.classList.remove(classes.headerCompressed)

      if (config.wrapperOverlayed) {
        wrapper.classList.add(classes.overlayStyle)
      }

      document.dispatchEvent(new CustomEvent('headerStickyChange'))
    }
  }

  // Set a max-height on drawers when they're opened via CSS variable
  // to account for changing mobile window heights
  sizeDrawer(evt) {
    let header = wrapper.offsetHeight
    let heights = evt.detail?.heights?.reduce((a, b) => a + b, 0) ?? 0
    let max = window.innerHeight - header - heights
    this.style.setProperty('--max-drawer-height', `${max}px`)
    this.style.setProperty('--header-nav-height', `${header - heights}px`)
  }
}

customElements.define('header-nav', HeaderNav)
