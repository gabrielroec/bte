import { ThemeEditorEventHandlerMixin } from '@archetype-themes/utils/theme-editor-event-handler-mixin'

export class ThemeElement extends HTMLElement {
  get sectionId() {
    this._sectionId = this._sectionId || this.getAttribute('section-id')

    if (!this._sectionId) {
      throw new Error(`The section-id attribute must be specified for ${this.tagName}`)
    }

    return this._sectionId
  }

  get locales() {
    this._locales =
      this._locales || JSON.parse(this.querySelector('script[type="application/json"][data-locales]').textContent)

    return this._locales
  }
}

export class HTMLThemeElement extends ThemeEditorEventHandlerMixin(ThemeElement) { }
