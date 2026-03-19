export default class AjaxRenderer {
  /**
   * Ajax Renderer
   * -----------------------------------------------------------------------------
   * Render sections without reloading the page.
   * @param {Object[]} sections - The section to update on render.
   * @param {string} sections[].sectionId - The ID of the section from Shopify.
   * @param {string} sections[].nodeId - The ID of the DOM node to replace.
   * @param {Function} sections[].onReplace (optional) - The custom render function.
   * @param {boolean} debug - Output logs to console for debugging.
   *
   */
  constructor({ sections, onReplace, debug } = {}) {
    this.sections = sections || []
    this.cachedSections = []
    this.onReplace = onReplace
    this.debug = Boolean(debug)
  }

  renderPage(basePath, newParams, updateURLHash = true) {
    document.dispatchEvent(new CustomEvent('ajaxRenderer:loading'))
    const currentParams = new URLSearchParams(window.location.search)
    const updatedParams = this.getUpdatedParams(currentParams, newParams)

    const sectionRenders = this.sections.map((section) => {
      const url = `${basePath}?section_id=${section.sectionId}&${updatedParams.toString()}`
      const cachedSectionUrl = (cachedSection) => cachedSection.url === url

      return this.cachedSections.some(cachedSectionUrl)
        ? this.renderSectionFromCache(cachedSectionUrl, section)
        : this.renderSectionFromFetch(url, section)
    })

    if (updateURLHash) this.updateURLHash(updatedParams)

    return Promise.all(sectionRenders)
  }

  renderSectionFromCache(url, section) {
    const cachedSection = this.cachedSections.find(url)

    this.log(`[AjaxRenderer] rendering from cache: url=${cachedSection.url}`)
    this.renderSection(cachedSection.html, section)
    return Promise.resolve(section)
  }

  renderSectionFromFetch(url, section) {
    this.log(`[AjaxRenderer] redering from fetch: url=${url}`)

    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          const html = responseText
          this.cachedSections = [...this.cachedSections, { html, url }]
          this.renderSection(html, section)
          resolve(section)
        })
        .catch((err) => reject(err))
    })
  }

  renderSection(html, section) {
    this.log(`[AjaxRenderer] rendering section: section=${JSON.stringify(section)}`)

    const newDom = new DOMParser().parseFromString(html, 'text/html')
    if (this.onReplace) {
      this.onReplace(newDom, section)
    } else {
      if (typeof section.nodeId === 'string') {
        var newContentEl = newDom.getElementById(section.nodeId)
        if (!newContentEl) {
          return
        }

        document.getElementById(section.nodeId).innerHTML = newContentEl.innerHTML
      } else {
        section.nodeId.forEach((id) => {
          document.getElementById(id).innerHTML = newDom.getElementById(id).innerHTML
        })
      }
    }

    return section
  }

  getUpdatedParams(currentParams, newParams) {
    const clone = new URLSearchParams(currentParams)
    const preservedParams = ['sort_by', 'q', 'options[prefix]', 'type']

    // Find what params need to be removed
    // delete happens first as we cannot specify keys based off of values
    for (const [key, value] of clone.entries()) {
      if (!newParams.getAll(key).includes(value) && !preservedParams.includes(key)) {
        clone.delete(key)
      }
    }

    // Find what params need to be added
    for (const [key, value] of newParams.entries()) {
      if (!clone.getAll(key).includes(value) && value !== '') {
        clone.append(key, value)
      }
    }

    return clone
  }

  updateURLHash(searchParams) {
    history.pushState({}, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`)
  }

  log(...args) {
    if (this.debug) {
      console.log(...args)
    }
  }
}
