/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 */

/**
 * Moves focus to an HTML element
 * eg for In-page links, after scroll, focus shifts to content area so that
 * next `tab` is where user expects. Used in bindInPageLinks()
 * eg move focus to a modal that is opened. Used in trapFocus()
 *
 * @param {Element} container - Container DOM element to trap focus inside of
 * @param {Object} options - Settings unique to your theme
 * @param {string} options.className - Class name to apply to element on focus.
 */
export function forceFocus(element, options = {}) {
  let savedTabIndex = element.tabIndex

  element.tabIndex = -1
  element.dataset.tabIndex = savedTabIndex
  element.focus()
  if (typeof options.className !== 'undefined') {
    element.classList.add(options.className)
  }
  element.addEventListener('blur', callback)

  function callback(event) {
    event.target.removeEventListener(event.type, callback)

    element.tabIndex = savedTabIndex
    delete element.dataset.tabIndex
    if (typeof options.className !== 'undefined') {
      element.classList.remove(options.className)
    }
  }
}

// https://github.com/Shopify/dawn/blob/v15.1.0/assets/global.js#L1-L7
export function focusable(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  )
}

/**
 * Traps the focus in a particular container
 *
 * @param {Element} container - Container DOM element to trap focus inside of
 * @param {Element} elementToFocus - Element to be focused on first
 * @param {Object} options - Settings unique to your theme
 * @param {string} options.className - Class name to apply to element on focus.
 */

let trapFocusHandlers = {}

export function trapFocus(container, options = {}) {
  let elements = focusable(container)
  let elementToFocus = options.elementToFocus || container
  let first = elements[0]
  let last = elements[elements.length - 1]

  removeTrapFocus()

  trapFocusHandlers.focusin = function (event) {
    if (container !== event.target && !container.contains(event.target)) {
      first.focus()
    }

    if (event.target !== container && event.target !== last && event.target !== first) return
    document.addEventListener('keydown', trapFocusHandlers.keydown)
  }

  trapFocusHandlers.focusout = function () {
    document.removeEventListener('keydown', trapFocusHandlers.keydown)
  }

  trapFocusHandlers.keydown = function (event) {
    if (event.keyCode !== 9) return // If not TAB key

    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault()
      first.focus()
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault()
      last.focus()
    }
  }

  document.addEventListener('focusout', trapFocusHandlers.focusout)
  document.addEventListener('focusin', trapFocusHandlers.focusin)

  forceFocus(elementToFocus, options)
}

/**
 * Removes the trap of focus from the page
 */
export function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin)
  document.removeEventListener('focusout', trapFocusHandlers.focusout)
  document.removeEventListener('keydown', trapFocusHandlers.keydown)

  if (elementToFocus) elementToFocus.focus()
}

let _handleTouchmove = () => true

export function lockMobileScrolling(element) {
  let el = element ? element : document.documentElement
  document.documentElement.classList.add('lock-scroll')
  el.addEventListener('touchmove', _handleTouchmove)
}

export function unlockMobileScrolling(element) {
  document.documentElement.classList.remove('lock-scroll')
  let el = element ? element : document.documentElement
  el.removeEventListener('touchmove', _handleTouchmove)
}

let scrollPosition = 0

/**
 * Locks the body from scrolling
 */
export function lockScroll() {
  scrollPosition = window.pageYOffset
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollPosition}px`
  document.body.style.width = '100%'
}

/**
 * Unlocks the body to scrolling
 */
export function unlockScroll() {
  document.body.style.removeProperty('overflow')
  document.body.style.removeProperty('position')
  document.body.style.removeProperty('top')
  document.body.style.removeProperty('width')
  window.scrollTo(0, scrollPosition)
}
