export const config = {
  bpSmall: false,
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  mediaQuerySmall: 'screen and (max-width: ' + 769 + 'px)',
  isTouch:
    'ontouchstart' in window ||
    (window.DocumentTouch && window.document instanceof DocumentTouch) ||
    window.navigator.maxTouchPoints ||
    window.navigator.msMaxTouchPoints
      ? true
      : false,
  rtl: document.documentElement.getAttribute('dir') == 'rtl' ? true : false,
  stickyHeader: false,
  hasSessionStorage: true,
  hasLocalStorage: true,
  // Filters clone for mobile
  filtersPrime: null,
  overlayHeader: false
}

// Trigger events when going between breakpoints
config.bpSmall = matchMedia(config.mediaQuerySmall).matches
matchMedia(config.mediaQuerySmall).addListener(function (mql) {
  if (mql.matches) {
    config.bpSmall = true
    document.dispatchEvent(new CustomEvent('matchSmall'))
  } else {
    config.bpSmall = false
    document.dispatchEvent(new CustomEvent('unmatchSmall'))
  }
})

config.hasSessionStorage = isStorageSupported('session')
config.hasLocalStorage = isStorageSupported('local')

function isStorageSupported(type) {
  // Return false if we are in an iframe without access to sessionStorage
  if (window.self !== window.top) {
    return false
  }

  var testKey = 'test'
  var storage
  if (type === 'session') {
    storage = window.sessionStorage
  }
  if (type === 'local') {
    storage = window.localStorage
  }

  try {
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

if (config.isTouch) {
  document.documentElement.className += ' supports-touch'
}
