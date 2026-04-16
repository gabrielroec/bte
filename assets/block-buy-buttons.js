import { EVENTS } from "@archetype-themes/utils/events";
import { formatMoney } from "@archetype-themes/utils/currency";

class BlockBuyButtons extends HTMLElement {
  constructor() {
    super();

    this.handleVariantChange = this.handleVariantChange.bind(this);
  }

  connectedCallback() {
    this.abortController = new AbortController();

    this.addEventListener("submit", this.handleSubmit.bind(this), {
      signal: this.abortController.signal,
    });

    document.addEventListener(`${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`, this.handleVariantChange, {
      signal: this.abortController.signal,
    });

    this.cartType = this.dataset.cartType;

    const pricingScript = this.querySelector("[data-pdp-unit-pricing]");
    const qtyRow = this.querySelector("[data-pdp-qty-total]");
    if (pricingScript && qtyRow) {
      try {
        this.pricing = JSON.parse(pricingScript.textContent);
        this.moneyFormat = this.pricing.moneyFormat || "${{amount}}";
      } catch (e) {
        this.pricing = null;
        this.moneyFormat = "${{amount}}";
      }

      const qtyCustom = qtyRow.querySelector("quantity-selector");
      if (qtyCustom) {
        qtyCustom.addEventListener("quantity:change", () => this.recalcLineTotal(), {
          signal: this.abortController.signal,
        });
      }

      const onSellingPlansChange = (e) => {
        const d = e.detail;
        if (!d) return;
        if (String(d.sectionId) !== String(this.dataset.sectionId)) return;
        if (String(d.productId) !== String(this.dataset.productId)) return;
        this.recalcLineTotal();
      };
      document.addEventListener("selling-plans:change", onSellingPlansChange, { signal: this.abortController.signal });

      queueMicrotask(() => {
        this.currentVariantId = this.querySelector(`#product-form-${this.dataset.sectionId} input[name="id"]`)?.value;
        this.recalcLineTotal();
      });
    }
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  getUnitCents() {
    if (!this.pricing?.variants) return 0;
    const vid = String(
      this.currentVariantId || this.querySelector(`#product-form-${this.dataset.sectionId} input[name="id"]`)?.value || ""
    );
    const v = this.pricing.variants[vid];
    if (!v) return 0;

    let selling = null;
    for (const el of document.querySelectorAll("block-selling-plans")) {
      if (el.dataset.sectionId === this.dataset.sectionId && String(el.dataset.productId) === String(this.dataset.productId)) {
        selling = el;
        break;
      }
    }
    if (selling) {
      const root = selling.querySelector("[data-selling-plans-root]");
      const mode = root?.querySelector('input[type="radio"][name^="purchase_mode_"]:checked');
      if (mode?.value === "subscribe") {
        const pill = root?.querySelector('input[type="radio"][name^="selling_plan_pill_"]:checked');
        const pid = pill?.value;
        const plans = v.plans;
        if (plans && pid != null && pid !== "") {
          if (Object.prototype.hasOwnProperty.call(plans, pid)) {
            return this._planPriceCents(plans[pid]);
          }
          const pidStr = String(pid);
          if (Object.prototype.hasOwnProperty.call(plans, pidStr)) {
            return this._planPriceCents(plans[pidStr]);
          }
        }
      }
    }

    return v.oneTime;
  }

  _planPriceCents(entry) {
    if (entry == null) return 0;
    if (typeof entry === "number") return entry;
    if (typeof entry === "object" && typeof entry.price === "number") return entry.price;
    return 0;
  }

  recalcLineTotal() {
    const row = this.querySelector("[data-pdp-qty-total]");
    if (!row || !this.pricing) return;

    const out = row.querySelector("[data-line-total]");
    const input = row.querySelector(".js-qty__num");
    if (!out || !input) return;

    const qty = parseInt(input.value, 10) || 1;
    const unit = this.getUnitCents();
    const total = unit * qty;

    try {
      out.textContent = formatMoney(total, this.moneyFormat, false);
    } catch (e) {
      out.textContent = "—";
    }
  }

  syncQtyConstraints(variant) {
    const row = this.querySelector("[data-pdp-qty-total]");
    if (!row || !this.pricing) return;

    const input = row.querySelector(".js-qty__num");
    if (!input) return;

    const vid = String(variant.id);
    const v = this.pricing.variants[vid];

    let min = 1;
    let max = null;
    if (v) {
      min = v.qtyMin ?? 1;
      max = v.qtyMax;
    } else if (variant.quantity_rule) {
      min = variant.quantity_rule.min ?? 1;
      max = variant.quantity_rule.max ?? null;
    }

    input.setAttribute("min", String(min));
    if (max != null && max !== "") {
      input.setAttribute("max", String(max));
    } else {
      input.removeAttribute("max");
    }

    let q = parseInt(input.value, 10) || min;
    if (q < min) q = min;
    if (max != null && q > max) q = max;
    input.value = String(q);
  }

  handleVariantChange({ detail }) {
    const { html, variant } = detail;

    if (!variant) {
      this.toggleAddButton(true, this.getLocales().unavailable);
      if (this.querySelector("[data-pdp-qty-total]")) {
        this.recalcLineTotal();
      }
      return;
    }

    this.currentVariantId = String(variant.id);
    this.updateVariantInput(variant);
    this.renderProductInfo(html);

    if (this.querySelector("[data-pdp-qty-total]")) {
      this.syncQtyConstraints(variant);
      this.recalcLineTotal();
    }
  }

  renderProductInfo(html) {
    const addButtonUpdated = html.getElementById(`ProductSubmitButton-${this.dataset.sectionId}`);

    if (addButtonUpdated) {
      this.toggleAddButton(addButtonUpdated.hasAttribute("disabled"), this.getLocales().soldOut);
    }
  }

  getLocales() {
    if (!this.locales) {
      const el = this.querySelector("[data-buy-buttons-locales]") || this.querySelector('script[type="application/json"]:last-of-type');
      this.locales = JSON.parse(el.textContent);
    }
    return this.locales;
  }

  toggleAddButton(disable = true, text) {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`);

    if (!productForm) return;

    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");
      if (text && addButtonText) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute("disabled");
      if (addButtonText) {
        addButtonText.textContent = this.dataset.template !== "preorder" ? this.getLocales().addToCart : this.getLocales().preOrder;
      }
    }
  }

  updateVariantInput(variant) {
    const productForms = this.querySelectorAll(
      `#product-form-${this.dataset.sectionId}, #product-form-installment-${this.dataset.sectionId}`
    );

    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = variant.id;

      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  async handleSubmit(event) {
    if (this.cartType == "page") return;

    event.preventDefault();
    this.disableAddToCartButton();

    try {
      const responseJson = await this.addVariantToCart();

      this.dispatchEvent(
        new CustomEvent(EVENTS.ajaxProductAdded, {
          bubbles: true,
          detail: {
            product: responseJson,
            addToCartBtn: this.querySelector(`#ProductSubmitButton-${this.dataset.sectionId}`),
          },
        })
      );
    } catch (error) {
      this.handleError(error);
    } finally {
      this.enableAddToCartButton();
    }
  }

  handleError(error) {
    if (!error.description) {
      console.warn(error);
      return;
    }

    let form = this.querySelector("form");
    let errors = this.querySelector("form .errors");

    if (errors) errors.remove();

    let errorDiv = document.createElement("div");
    errorDiv.classList.add("errors", "text-center");

    if (typeof error.description === "object") {
      errorDiv.textContent = error.message;
    } else {
      errorDiv.textContent = error.description;
    }

    form.append(errorDiv);

    this.dispatchEvent(
      new CustomEvent(EVENTS.ajaxProductError, {
        bubbles: true,
        detail: {
          errorMessage: error.description,
        },
      })
    );
  }

  async addVariantToCart() {
    const formData = this.getFormDataWithSections();

    const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: formData,
    });

    if (!response.ok) {
      throw await response.json();
    }

    return response.json();
  }

  async fetchCart() {
    return (await fetch(`${window.Shopify.routes.root}cart.js`)).json();
  }

  getFormDataWithSections() {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`);
    const formData = new FormData(productForm);

    const variantId = productForm.querySelector('input[name="id"]')?.value;
    formData.set("sections_url", `${window.Shopify.routes.root}variants/${variantId}`);
    // Bundled section rendering
    formData.set("sections", "cart-ajax");

    return formData;
  }

  enableAddToCartButton() {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`);

    if (!productForm) return;

    const addButton = productForm.querySelector('[name="add"]');
    addButton.removeAttribute("aria-busy");
    addButton.classList.remove("btn--loading");
  }

  disableAddToCartButton() {
    const productForm = this.querySelector(`#product-form-${this.dataset.sectionId}`);
    const errors = this.querySelector("form .errors");

    if (errors) errors.remove();
    if (!productForm) return;

    const addButton = productForm.querySelector('[name="add"]');
    addButton.setAttribute("aria-busy", "true");
    addButton.classList.add("btn--loading");
  }
}

customElements.define("block-buy-buttons", BlockBuyButtons);
