class CartNote extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.noteInput = this.querySelector('[name="note"]')
    this.noteBtn = this.querySelector('.add-note')

    this.noteInput.addEventListener(
      'change',
      function (evt) {
        const newNote = evt.target.value
        this.updateNote(newNote)
      }.bind(this),
      { signal: this.abortController.signal }
    )

    this.noteBtn.addEventListener(
      'click',
      () => {
        this.noteBtn.classList.toggle('is-active')
        this.querySelector('.cart__note').classList.toggle('hide')
      },
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  updateNote(note) {
    return fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        note: note
      })
    }).then((response) => {
      if (!response.ok) throw response
      return response.json()
    })
  }
}

customElements.define('cart-note', CartNote)
