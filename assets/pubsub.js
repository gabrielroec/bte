export function subscribe(eventName, callback) {
  let cb = (event) => callback(event)

  document.addEventListener(eventName, cb)

  return function unsubscribe() {
    document.removeEventListener(eventName, cb)
  }
}

export function publish(eventName, options) {
  document.dispatchEvent(new CustomEvent(eventName, options))
}

export const EVENTS = {
  variantChange: 'variant:change',
  ajaxProductError: 'ajaxProduct:error',
  ajaxProductAdded: 'ajaxProduct:added',
  mobileNavOpen: 'mobileNav:open',
  mobileNavClose: 'mobileNav:close',
  mobileNavClosed: 'mobileNav:closed',
  predictiveSearchOpen: 'predictiveSearch:open',
  predictiveSearchClose: 'predictiveSearch:close',
  predictiveSearchCloseAll: 'predictiveSearch:close-all',
  headerStickyCheck: 'headerSticky:check',
  overlayHeaderChange: 'overlayHeader:change',
  headerOverlayDisable: 'headerOverlay:disable',
  headerOverlayRemoveClass: 'headerOverlay:remove-class',
  cartDrawerChange: 'CartDrawer:change',
  youtubeReady: 'youtube:ready',
  vimeoReady: 'vimeo:ready',
  filtersCloned: 'filters:cloned'
}
