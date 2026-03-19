import { executeJSmodules } from '@archetype-themes/utils/utils'

document.addEventListener('shopify:section:load', function (event) {
  const sectionId = event.detail.sectionId
  const scripts = document.querySelectorAll(`[data-section-id="${sectionId}"] script[type="module"]`)
  executeJSmodules(scripts)
})
