import { loadScript, loadCSS } from '@archetype-themes/utils/resource-loader'

const MAPBOX_VERSION = '2.15.0'
const MAPBOX_BASE_URL = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}`

const DEFAULT_ZOOM = 9
const DEFAULT_LATITUDE = 0
const DEFAULT_LONGITUDE = 0

class MapboxMap extends HTMLElement {
  static #mapboxPromise = null

  #map = null

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  async connectedCallback() {
    this.render()
    this.initializeMap().catch((error) => {
      console.error('Error initializing Mapbox map:', error)
    })
  }

  disconnectedCallback() {
    if (this.#map) {
      this.#map.remove()
      this.#map = null
    }
  }

  async initializeMap() {
    await MapboxMap.loadMapboxResources()
    await this.createMap()
  }

  static async loadMapboxResources() {
    if (!MapboxMap.#mapboxPromise) {
      MapboxMap.#mapboxPromise = Promise.all([
        loadScript(`${MAPBOX_BASE_URL}/mapbox-gl.js`, 'mapboxgl'),
        loadCSS(`${MAPBOX_BASE_URL}/mapbox-gl.css`)
      ])
    }

    await MapboxMap.#mapboxPromise
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        #map { position: absolute; width: 100%; height: 100%; }
      </style>
      <div id="map"></div>
    `
  }

  async createMap() {
    const { accessToken, address, zoom } = this

    if (!accessToken || accessToken.trim() === '') {
      throw new Error('Mapbox access token is required')
    }

    mapboxgl.accessToken = accessToken

    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}`
    const response = await fetch(geocodingUrl)
    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      throw new Error('Unable to geocode the address')
    }

    const [longitude, latitude] = data.features[0].center

    return new Promise((resolve, reject) => {
      this.#map = new mapboxgl.Map({
        container: this.shadowRoot.getElementById('map'),
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom,
        interactive: false,
        attributionControl: false
      })

      this.#map.on('load', resolve)
      this.#map.on('error', (e) => {
        console.error('Mapbox GL JS error:', e)
        reject(new Error('Failed to initialize Mapbox map'))
      })
    })
  }

  get accessToken() {
    return this.getAttribute('access-token')
  }

  get address() {
    return this.getAttribute('address')
  }

  get zoom() {
    return parseInt(this.getAttribute('zoom') || DEFAULT_ZOOM.toString(), 10)
  }
}

customElements.define('mapbox-map', MapboxMap)
