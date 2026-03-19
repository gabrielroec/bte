import Photoswipe from '@archetype-themes/modules/photoswipe'
import { Slideshow } from '@archetype-themes/modules/slideshow'
import { EVENTS } from '@archetype-themes/utils/events'

class ProductImages extends HTMLElement {
  constructor() {
    super()

    this.classes = {
      hidden: 'hide'
    }

    this.selectors = {
      videoParent: '.product__video-wrapper',
      modelParent: '.product__model-wrapper',
      slide: '.product-main-slide',
      currentSlide: '.is-selected',
      startingSlide: '.starting-slide',
      currentVariantJson: '[data-current-variant-json]',
      productOptionsJson: '[data-product-options-json]',
      closeMedia: '.product-single__close-media',
      thumbSlider: '[data-product-thumbs]',
      thumbScroller: '.product__thumbs--scroller',
      mainSlider: '[data-product-photos]',
      imageContainer: '[data-product-images]'
    }

    this.settings = {
      imageSetName: null,
      imageSetIndex: null,
      currentImageSet: null,
      currentSlideIndex: 0,
      mediaGalleryLayout: this.dataset.mediaGalleryLayout,
      hasVideos: this.querySelector(this.selectors.videoParent) ? true : false,
      hasModels: this.querySelector(this.selectors.modelParent) ? true : false
    }
  }

  connectedCallback() {
    if (!this.dataset.modal) return

    this.abortController = new AbortController()
    this.videoObjects = {}

    this.sectionId = this.getAttribute('data-section-id')

    this.currentVariant = JSON.parse(this.querySelector(this.selectors.currentVariantJson).textContent)
    this.productOptions = JSON.parse(this.querySelector(this.selectors.productOptionsJson).textContent)

    this.cacheElements()

    const dataSetEl = this.cache.mainSlider.querySelector('[data-set-name]')
    if (dataSetEl) {
      this.settings.imageSetName = dataSetEl.dataset.setName
      this.settings.imageSetIndex =
        'option' + (this.productOptions.findIndex((opt) => this.getImageSetName(opt) == this.settings.imageSetName) + 1)
    }

    this.initVariants()
    this.initImageZoom()
    this.initProductSlider(this.currentVariant)
    this.customMediaListeners()
  }

  disconnectedCallback() {
    this.abortController.abort()

    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }
  }

  cacheElements() {
    this.cache = {
      mainSlider: this.querySelector(this.selectors.mainSlider),
      thumbSlider: this.querySelector(this.selectors.thumbSlider),
      thumbScroller: this.querySelector(this.selectors.thumbScroller)
    }
  }

  initVariants() {
    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.updateVariantImage.bind(this),
      { signal: this.abortController.signal }
    )

    // image set names variant change listeners
    if (this.settings.imageSetIndex) {
      document.addEventListener(
        `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
        this.updateImageSet.bind(this),
        { signal: this.abortController.signal }
      )
    }
  }

  /*============================================================================
    Variant change methods
  ==============================================================================*/
  imageSetArguments(variant) {
    variant = variant ? variant : this.variants ? this.variants.currentVariant : null
    if (!variant) return

    const setValue = (this.settings.currentImageSet = this.getImageSetName(variant[this.settings.imageSetIndex]))
    const set = `${this.settings.imageSetName}_${setValue}`

    // Always start on index 0
    this.settings.currentSlideIndex = 0

    // Return object that adds cellSelector to mainSliderArgs
    return {
      cellSelector: '[data-group="' + set + '"]',
      imageSet: set,
      initialIndex: this.settings.currentSlideIndex
    }
  }

  updateImageSet(evt) {
    // If called directly, use current variant
    const variant = evt ? evt.detail.variant : this.variants ? this.variants.currentVariant : null
    if (!variant) {
      return
    }

    const setValue = this.getImageSetName(variant[this.settings.imageSetIndex])

    // Already on the current image group
    if (this.settings.currentImageSet === setValue) {
      return
    }

    this.initProductSlider(variant)
    /**
     * @event product-images:updateImageSet
     * @description Triggered when the image set is updated.
     */
    this.dispatchEvent(new CustomEvent('product-images:updateImageSet', { bubbles: true }))
  }

  // Show/hide thumbnails based on current image set
  updateImageSetThumbs(set) {
    this.cache.thumbSlider?.querySelectorAll('.product__thumb-item').forEach((thumb) => {
      thumb.classList.toggle(this.classes.hidden, thumb.dataset.group !== set)
    })
  }

  getImageSetName(string) {
    return string
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '')
      .replace(/^-/, '')
  }

  /*============================================================================
    Product images
  ==============================================================================*/
  initImageZoom() {
    const container = this
    if (!container) {
      return
    }
    this.photoswipe = new Photoswipe(this, this.sectionId)
    container.addEventListener(
      'photoswipe:afterChange',
      function (evt) {
        if (this.flickity) {
          this.flickity.goToSlide(evt.detail.index)
        }
      }.bind(this)
    )
    // Execute JS modules after the tooltip is opened
    document.addEventListener('tooltip:open', (e) => {
      if (!e.detail.context === 'QuickShop') return
      const scripts = document.querySelectorAll('tool-tip product-component script[type="module"]')
      for (let i = 0; i < scripts.length; i++) {
        let script = document.createElement('script')
        script.type = 'module'
        script.textContent = scripts[i].textContent
        scripts[i].parentNode.replaceChild(script, scripts[i])
      }
    })
  }

  getThumbIndex(target) {
    return target.dataset.index
  }

  updateVariantImage(evt) {
    const variant = evt?.detail?.variant

    if (!variant || !variant.featured_media) return
    if (!matchMedia('(max-width: 768px)').matches && this.settings.mediaGalleryLayout === 'stacked') {
      const slide = this.cache.mainSlider.querySelector(
        `.product-main-slide[data-media-id="${variant.featured_media.id}"]`
      )

      const imageIndex = this.getThumbIndex(slide)

      this.scrollToStackedMedia(imageIndex)

      this.handleStackedMediaChange(imageIndex)
    } else {
      const newImage = this.querySelector(`.product-main-slide[data-media-id="${variant.featured_media.id}"]`)
      const imageIndex = this.getThumbIndex(newImage)

      // If there is no index, slider is not initalized
      if (typeof imageIndex === 'undefined') {
        return
      }

      // Go to that variant image's slide
      if (this.flickity) {
        this.flickity.goToSlide(imageIndex)
      }
    }
  }

  stackedMediaInit() {
    const mediaGalleryElements = this.querySelectorAll('.product-slideshow .product-main-slide')

    this.mediaObservers = []

    for (let index = 0; index < mediaGalleryElements.length; index++) {
      const slideElement = mediaGalleryElements[index]
      const mediaObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              this.settings.currentSlideIndex = index
              this.handleStackedMediaChange(this.settings.currentSlideIndex)
            }
          })
        },
        {
          root: null, // Use the viewport as the root
          rootMargin: '400px 0px 0px 0px', // Adjust the top offset to delay the intersection
          threshold: [0, 0.5, 1]
        }
      )

      mediaObserver.observe(slideElement)

      // Store mediaObserver instance in array
      this.mediaObservers.push(mediaObserver)
    }
  }

  handleStackedMediaChange(index) {
    const mediaTarget = this.querySelectorAll('.product-slideshow .product-main-slide')[index]

    if (!mediaTarget) return

    if (this.settings.hasVideos) {
      const video = mediaTarget.querySelector(this.selectors.videoParent)
      if (video) {
        const isLandEl = video.querySelector('is-land')
        const videoMediaEl = video.querySelector('video-media')
        isLandEl.dispatchEvent(new CustomEvent('select'))
        if (
          videoMediaEl.hasAttribute('autoplay') &&
          !videoMediaEl.hasAttribute('playing') &&
          videoMediaEl.hasAttribute('loaded')
        ) {
          videoMediaEl.play()
        }
      }
    }

    if (this.settings.hasModels) {
      const model = mediaTarget.querySelector(this.selectors.modelParent)
      if (model) {
        const isLandEl = model.querySelector('is-land')
        const modelMediaEl = model.querySelector('model-media')
        isLandEl.dispatchEvent(new CustomEvent('select'))
        if (
          modelMediaEl.hasAttribute('autoplay') &&
          !modelMediaEl.hasAttribute('playing') &&
          modelMediaEl.hasAttribute('loaded')
        ) {
          modelMediaEl.play()
        }
      }

      const currentMedia = mediaTarget.querySelector(this.selectors.media)
      if (currentMedia) {
        currentMedia.dispatchEvent(
          /**
           * @event mediaVisible
           * @description Event fired when media is visible.
           * @param {object} detail - The detail object.
           * @param {boolean} detail.autoplayMedia - Whether the media should autoplay or not.
           * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
           * @param {boolean} cancelable - Whether the event is cancelable or not.
           */
          new CustomEvent('mediaVisible', {
            bubbles: true,
            cancelable: true,
            detail: {
              autoplayMedia: false
            }
          })
        )
        mediaTarget.querySelector('.shopify-model-viewer-ui__button').setAttribute('tabindex', 0)
        mediaTarget.querySelector('.product-single__close-media').setAttribute('tabindex', 0)
      }
    }
  }

  scrollToStackedMedia(index) {
    const mediaTarget = this.querySelectorAll('.product-slideshow .product-main-slide')[index]

    if (!mediaTarget) return

    const position = mediaTarget.offsetTop

    window.scroll({
      top: position,
      behavior: 'smooth'
    })
  }

  initProductSlider(variant) {
    // Stop if only a single image, but add active class to first slide
    if (this.cache.mainSlider.querySelectorAll(this.selectors.slide).length <= 1) {
      const slide = this.cache.mainSlider.querySelector(this.selectors.slide)
      if (slide) {
        slide.classList.add('is-selected')
      }
      return
    }

    // Destroy slider in preparation of new initialization
    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy()
    }

    // If variant argument exists, slideshow is reinitializing because of the
    // image set feature enabled and switching to a new group.
    // currentSlideIndex
    if (variant) {
      const activeSlide = this.cache.mainSlider.querySelector(this.selectors.startingSlide)
      this.settings.currentSlideIndex = this._slideIndex(activeSlide)
    }

    let mainSliderArgs = {
      dragThreshold: 25,
      adaptiveHeight: true,
      avoidReflow: true,
      initialIndex: this.settings.currentSlideIndex,
      childNav: this.cache.thumbSlider,
      childNavScroller: this.cache.thumbScroller,
      childVertical: this.cache.thumbSlider?.dataset.position === 'beside',
      pageDots: true, // mobile only with CSS
      wrapAround: true,
      callbacks: {
        onInit: this.onSliderInit.bind(this),
        onChange: this.onSlideChange.bind(this)
      }
    }

    // Override default settings if image set feature enabled
    if (this.settings.imageSetName) {
      const imageSetArgs = this.imageSetArguments(variant)
      mainSliderArgs = Object.assign({}, mainSliderArgs, imageSetArgs)
      this.updateImageSetThumbs(mainSliderArgs.imageSet)
    }

    if (!matchMedia('(max-width: 768px)').matches && this.settings.mediaGalleryLayout === 'stacked') {
      const imageContainer = this.querySelector(this.selectors.imageContainer) || this
      imageContainer.setAttribute('data-has-slideshow', 'false')

      this.stackedMediaInit()
      return
    }

    this.flickity = new Slideshow(this.cache.mainSlider, mainSliderArgs)

    // Ensure we resize the slider to avoid reflow issues
    setTimeout(() => {
      this.flickity.resize()
    }, 100)
  }

  onSliderInit(slide) {
    // If slider is initialized with image set feature active,
    // initialize any videos/media when they are first slide
    const video = slide.querySelector(this.selectors.videoParent)
    if (video) {
      const isLandEl = video.querySelector('is-land')
      isLandEl.dispatchEvent(new CustomEvent('select'))
    }

    const model = slide.querySelector(this.selectors.modelParent)
    if (model) {
      const isLandEl = model.querySelector('is-land')
      isLandEl.dispatchEvent(new CustomEvent('select'))
    }

    if (this.settings.imageSetName) {
      this.prepMediaOnSlide(slide)
    }
  }

  onSlideChange(index) {
    if (!this.flickity) return

    const prevSlide = this.cache.mainSlider.querySelector(
      '.product-main-slide[data-index="' + this.settings.currentSlideIndex + '"]'
    )

    // If imageSetName exists, use a more specific selector
    const nextSlide = this.settings.imageSetName
      ? this.cache.mainSlider.querySelectorAll('.flickity-slider .product-main-slide')[index]
      : this.cache.mainSlider.querySelector('.product-main-slide[data-index="' + index + '"]')

    prevSlide.setAttribute('tabindex', '-1')
    nextSlide.setAttribute('tabindex', 0)

    // Pause any existing slide video/media
    this.stopMediaOnSlide(prevSlide)

    // Prep next slide video/media
    this.prepMediaOnSlide(nextSlide)

    // Update current slider index
    this.settings.currentSlideIndex = index
  }

  stopMediaOnSlide(slide) {
    // Stop existing video
    const video = slide.querySelector(this.selectors.videoParent)
    if (video) {
      const videoMediaEl = video.querySelector('video-media')
      if (videoMediaEl.hasAttribute('playing')) {
        videoMediaEl.pause()
      }
    }

    // Stop existing media
    const currentMedia = slide.querySelector(this.selectors.modelParent)
    if (currentMedia) {
      const modelMediaEl = currentMedia.querySelector('model-media')
      if (modelMediaEl.hasAttribute('playing')) {
        modelMediaEl.pause()
      }
    }
  }

  prepMediaOnSlide(slide) {
    const video = slide.querySelector(this.selectors.videoParent)
    if (video) {
      this.flickity.reposition()
      const isLandEl = video.querySelector('is-land')
      const videoMediaEl = video.querySelector('video-media')
      isLandEl.dispatchEvent(new CustomEvent('select'))
      if (
        videoMediaEl.hasAttribute('autoplay') &&
        !videoMediaEl.hasAttribute('playing') &&
        videoMediaEl.hasAttribute('loaded')
      ) {
        videoMediaEl.play()
      }
    }

    const nextMedia = slide.querySelector(this.selectors.modelParent)
    if (nextMedia) {
      this.flickity.reposition()
      const isLandEl = nextMedia.querySelector('is-land')
      const modelMediaEl = nextMedia.querySelector('model-media')
      isLandEl.dispatchEvent(new CustomEvent('select'))
      if (
        modelMediaEl.hasAttribute('autoplay') &&
        !modelMediaEl.hasAttribute('playing') &&
        modelMediaEl.hasAttribute('loaded')
      ) {
        modelMediaEl.play()
      }
    }
  }

  _slideIndex(el) {
    return el.getAttribute('data-index')
  }

  customMediaListeners() {
    document.querySelectorAll(this.selectors.closeMedia).forEach((el) => {
      el.addEventListener(
        'click',
        function () {
          let slide

          if (this.settings.mediaGalleryLayout === 'stacked') {
            slide = this.cache.mainSlider.querySelector(
              `.product-main-slide[data-index="${this.settings.currentSlideIndex}"]`
            )
          } else {
            slide = this.cache.mainSlider.querySelector(this.selectors.currentSlide)
          }

          const media = slide.querySelector(this.selectors.media)
          if (media) {
            media.dispatchEvent(
              new CustomEvent('mediaHidden', {
                bubbles: true,
                cancelable: true
              })
            )
          }
        }.bind(this)
      )
    })

    const modelViewers = this.querySelectorAll('model-viewer')
    if (modelViewers.length) {
      modelViewers.forEach((el) => {
        el.addEventListener('shopify_model_viewer_ui_toggle_play', this.mediaLoaded.bind(this), {
          signal: this.abortController.signal
        })

        el.addEventListener('shopify_model_viewer_ui_toggle_pause', this.mediaUnloaded.bind(this), {
          signal: this.abortController.signal
        })
      })
    }
  }

  mediaLoaded(evt) {
    if (this.flickity) {
      this.flickity.setDraggable(false)
    }
  }

  mediaUnloaded(evt) {
    if (this.flickity) {
      this.flickity.setDraggable(true)
    }
  }
}

customElements.define('product-images', ProductImages)
