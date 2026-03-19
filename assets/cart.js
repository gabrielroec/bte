export function getCart() {
  const url = `${window.Shopify.routes.root}cart.js?t=${Date.now()}`
  return fetch(url, {
    credentials: 'same-origin',
    method: 'GET'
  }).then((response) => response.json())
}

export function getCartProductMarkup() {
  let url = `${window.Shopify.routes.root}cart?t=${Date.now()}`

  url += url.includes('?') ? `&view=ajax` : `?view=ajax`

  return fetch(url, {
    credentials: 'same-origin',
    method: 'GET'
  })
    .then((response) => response.text())
    .catch((e) => console.error(e))
}

export function changeItem(key, qty) {
  return _updateCart({
    url: `${window.Shopify.routes.root}cart/change.js?t=${Date.now()}`,
    data: JSON.stringify({
      id: key,
      quantity: qty
    })
  })
}

export function updateAttribute(key, value) {
  return _updateCart({
    url: '/cart/update.js',
    data: JSON.stringify({
      attributes: {
        [key]: _attributeToString(value)
      }
    })
  })
}

export function updateNote(note) {
  return _updateCart({
    url: '/cart/update.js',
    data: JSON.stringify({
      note: _attributeToString(note)
    })
  })
}

function _updateCart(params) {
  return fetch(params.url, {
    method: 'POST',
    body: params.data,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json'
    }
  })
    .then((response) => {
      return response.text()
    })
    .then((cart) => {
      return cart
    })
}

function _attributeToString(attribute) {
  if (typeof attribute !== 'string') {
    attribute += ''
    if (attribute === 'undefined') {
      attribute = ''
    }
  }
  return attribute.trim()
}
