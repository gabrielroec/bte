import { debounce } from '@archetype-themes/utils/utils'
import { HTMLThemeElement } from '@archetype-themes/custom-elements/theme-element'

class ImageCompare extends HTMLThemeElement {
  constructor() {
    super()
    this.active = false
    this.currentX = 0
    this.initialX = 0
    this.xOffset = 0
    this.abortController = new AbortController()
  }

  connectedCallback() {
    super.connectedCallback()
    this.el = this
    this.button = this.querySelector('[data-button]')
    this.draggableContainer = this.querySelector('[data-draggable]')
    this.primaryImage = this.querySelector('[data-primary-image]')
    this.secondaryImage = this.querySelector('[data-secondary-image]')

    this.calculateSizes()

    this.buttonOffset = this.button.offsetWidth / 2

    const { signal } = this.abortController

    this.el.addEventListener('touchstart', this.dragStart.bind(this), { signal })
    this.el.addEventListener('touchend', this.dragEnd.bind(this), { signal })
    this.el.addEventListener('touchmove', this.drag.bind(this), { signal })

    this.el.addEventListener('mousedown', this.dragStart.bind(this), { signal })
    this.el.addEventListener('mouseup', this.dragEnd.bind(this), { signal })
    this.el.addEventListener('mousemove', this.drag.bind(this), { signal })

    window.addEventListener(
      'resize',
      debounce(250, () => {
        this.calculateSizes(true)
      }),
      { signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  calculateSizes(hasResized = false) {
    this.buttonOffset = this.button.offsetWidth / 2

    this.elWidth = this.el.offsetWidth

    if (this.primaryImage) {
      this.primaryImage.style.width = `${this.elWidth}px`
    }

    if (hasResized) {
      const ratio = this.currentX / this.elWidth
      this.currentX = ratio * this.elWidth
      this.setTranslate(this.currentX, this.button)
    } else {
      this.draggableContainer.style.width = `${this.elWidth / 2}px`
      this.button.style.transform = `translate(-${this.buttonOffset}px, -50%)`
    }
  }

  dragStart(e) {
    if (e.type === 'touchstart') {
      this.initialX = e.touches[0].clientX - this.xOffset
    } else {
      this.initialX = e.clientX - this.xOffset
    }

    if (e.target === this.button) {
      this.active = true
    }
  }

  dragEnd() {
    this.initialX = this.currentX

    this.active = false
  }

  drag(event) {
    if (this.active) {
      event.preventDefault()

      if (event.type === 'touchmove') {
        this.currentX = event.touches[0].clientX - this.initialX
      } else {
        this.currentX = event.clientX - this.initialX
      }

      this.xOffset = this.currentX
      this.setTranslate(this.currentX, this.button)
    }
  }

  setTranslate(xPos, el) {
    let newXpos = xPos - this.buttonOffset
    let containerWidth

    const boundaryPadding = 50
    const XposMin = (this.elWidth / 2 + this.buttonOffset) * -1
    const XposMax = this.elWidth / 2 - this.buttonOffset

    // Set boundaries for dragging
    if (newXpos < XposMin + boundaryPadding) {
      newXpos = XposMin + boundaryPadding
      containerWidth = boundaryPadding
    } else if (newXpos > XposMax - boundaryPadding) {
      newXpos = XposMax - boundaryPadding
      containerWidth = this.elWidth - boundaryPadding
    } else {
      containerWidth =
        document.documentElement.dir === 'rtl' ? this.elWidth - (this.elWidth / 2 + xPos) : this.elWidth / 2 + xPos
    }

    el.style.transform = `translate(${newXpos}px, -50%)`
    this.draggableContainer.style.width = `${containerWidth}px`
  }
}

customElements.define('image-compare', ImageCompare)
