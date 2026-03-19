class SectionMainAddresses extends HTMLElement {
  connectedCallback() {
    this.customAddressForm()
  }

  customAddressForm() {
    const newAddressForm = document.getElementById('AddressNewForm')
    const addressForms = document.querySelectorAll('.js-address-form')

    if (!newAddressForm || !addressForms.length) {
      return
    }

    // Country/province selector can take a short time to load
    setTimeout(() => {
      document.querySelectorAll('.js-address-country').forEach((el) => {
        const countryId = el.dataset.countryId
        const provinceId = el.dataset.provinceId
        const provinceContainerId = el.dataset.provinceContainerId

        new Shopify.CountryProvinceSelector(countryId, provinceId, {
          hideElement: provinceContainerId
        })
      })
    }, 1000)

    document.querySelectorAll('.address-new-toggle').forEach((el) => {
      el.addEventListener('click', (event) => {
        newAddressForm.classList.toggle('hide')
      })
    })

    document.querySelectorAll('.address-edit-toggle').forEach((el) => {
      el.addEventListener('click', (event) => {
        const formId = event.currentTarget.dataset.formId
        document.getElementById('EditAddress_' + formId).classList.toggle('hide')
      })
    })

    document.querySelectorAll('.address-delete').forEach((el) => {
      el.addEventListener('click', (event) => {
        const formId = event.currentTarget.dataset.formId
        const confirmMessage = event.currentTarget.dataset.confirmMessage

        if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
          if (Shopify) {
            Shopify.postLink('/account/addresses/' + formId, {
              parameters: { _method: 'delete' }
            })
          }
        }
      })
    })
  }
}

customElements.define('section-main-addresses', SectionMainAddresses)
