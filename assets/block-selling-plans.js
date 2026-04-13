import { EVENTS } from "@archetype-themes/utils/events";

class BlockSellingPlans extends HTMLElement {
  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
    this.onVariantChange = this.onVariantChange.bind(this);
  }

  connectedCallback() {
    this.abortController = new AbortController();
    const configEl = this.querySelector("[data-selling-plans-config]");
    if (!configEl) return;

    this.config = JSON.parse(configEl.textContent);
    this.modeName = this.config.modeName;
    this.pillName = this.config.pillName;
    this.hiddenInput = this.querySelector('input[name="selling_plan"]');
    this.rootInner = this.querySelector("[data-selling-plans-root]");

    if (!this.rootInner || !this.hiddenInput) return;

    this.rootInner.addEventListener("change", this.onChange, {
      signal: this.abortController.signal,
    });

    document.addEventListener(`${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`, this.onVariantChange, {
      signal: this.abortController.signal,
    });

    queueMicrotask(() => this.emitChange());
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  onVariantChange({ detail }) {
    const variant = detail?.variant;
    if (!variant) return;
    this.renderVariant(String(variant.id));
  }

  onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.name === this.modeName && target.type === "radio" && target.checked) {
      this.syncMode(target.value === "subscribe");
      this.emitChange();
      return;
    }

    if (target.name === this.pillName && target.type === "radio" && target.checked) {
      this.applyPillSelection(target);
      this.emitChange();
    }
  }

  emitChange(variantId) {
    if (!this.rootInner) return;

    const subscribe = this.isSubscribeMode();
    let planId = null;
    if (subscribe) {
      const pill = this.rootInner.querySelector(`input[name="${this.pillName}"]:checked`);
      planId = pill?.value ?? null;
    }

    const vid =
      variantId != null
        ? String(variantId)
        : document.querySelector(`#product-form-${this.dataset.sectionId} input[name="id"]`)?.value ?? null;

    const detail = {
      sectionId: this.dataset.sectionId,
      productId: this.dataset.productId,
      subscribe,
      planId,
      variantId: vid,
    };
    // Bubble from this element so document/window listeners behave like normal DOM events
    // (dispatching only on document can be missed by some listeners in edge cases)
    this.dispatchEvent(
      new CustomEvent("selling-plans:change", {
        bubbles: true,
        composed: true,
        detail,
      })
    );
  }

  syncMode(subscribe) {
    const subPanel = this.rootInner.querySelector("[data-panel-subscribe]");
    const onePanel = this.rootInner.querySelector("[data-panel-onetime]");
    const freq = this.rootInner.querySelector("[data-frequency-block]");

    if (subPanel) subPanel.classList.toggle("selling-plans-widget__panel--active", subscribe);
    if (onePanel) onePanel.classList.toggle("selling-plans-widget__panel--active", !subscribe);

    if (subscribe) {
      if (freq) freq.hidden = false;
      const pill =
        this.rootInner.querySelector(`input[name="${this.pillName}"]:checked`) ||
        this.rootInner.querySelector(`input[name="${this.pillName}"]`);
      if (pill) {
        pill.checked = true;
        this.applyPillSelection(pill);
        this.hiddenInput.removeAttribute("disabled");
      }
    } else {
      if (freq) freq.hidden = true;
      this.hiddenInput.value = "";
      this.hiddenInput.setAttribute("disabled", "disabled");
    }
  }

  applyPillSelection(pillInput) {
    const label = pillInput.closest("label");
    const price = label?.dataset.spPrice || "";
    const compare = label?.dataset.spCompare || "";

    const curEl = this.rootInner.querySelector("[data-subscribe-price]");
    const cmpEl = this.rootInner.querySelector("[data-subscribe-compare]");

    if (curEl) curEl.textContent = price;
    if (cmpEl) {
      cmpEl.textContent = compare;
      cmpEl.classList.toggle("selling-plans-widget__price-compare--hidden", !compare);
    }

    if (this.isSubscribeMode()) {
      this.hiddenInput.value = pillInput.value;
      this.hiddenInput.removeAttribute("disabled");
    }
  }

  isSubscribeMode() {
    const el = this.rootInner.querySelector(`input[name="${this.modeName}"]:checked`);
    return el?.value === "subscribe";
  }

  renderVariant(variantId) {
    const data = this.config.variants[variantId];
    if (!data) return;

    const sectionId = this.dataset.sectionId;
    const allocations = data.allocations || [];

    const onetimeEl = this.rootInner.querySelector("[data-onetime-price]");
    if (onetimeEl) onetimeEl.textContent = data.onetimePrice || "";

    const subPanel = this.rootInner.querySelector("[data-panel-subscribe]");

    if (allocations.length === 0) {
      if (subPanel) subPanel.hidden = true;
      const freqEl = this.rootInner.querySelector("[data-frequency-block]");
      if (freqEl) freqEl.hidden = true;
      const subMode = this.rootInner.querySelector(`#sp-mode-sub-${sectionId}`);
      const onceMode = this.rootInner.querySelector(`#sp-mode-once-${sectionId}`);
      if (subMode) subMode.checked = false;
      if (onceMode) onceMode.checked = true;
      this.rootInner.querySelector("[data-panel-onetime]")?.classList.add("selling-plans-widget__panel--active");
      this.rootInner.querySelector("[data-panel-subscribe]")?.classList.remove("selling-plans-widget__panel--active");
      this.hiddenInput.value = "";
      this.hiddenInput.setAttribute("disabled", "disabled");
      this.emitChange(variantId);
      return;
    }

    if (subPanel) subPanel.hidden = false;

    const first = allocations[0];
    const curEl = this.rootInner.querySelector("[data-subscribe-price]");
    const cmpEl = this.rootInner.querySelector("[data-subscribe-compare]");
    if (curEl) curEl.textContent = first.price || "";
    if (cmpEl) {
      cmpEl.textContent = first.compareAt || "";
      cmpEl.classList.toggle("selling-plans-widget__price-compare--hidden", !first.compareAt);
    }

    const pillsRoot = this.rootInner.querySelector("[data-pills-root]");
    if (pillsRoot) {
      pillsRoot.replaceChildren();
      allocations.forEach((plan, index) => {
        const lab = document.createElement("label");
        lab.className = "selling-plans-widget__pill";
        lab.dataset.spPrice = plan.price;
        if (plan.compareAt) lab.dataset.spCompare = plan.compareAt;

        const input = document.createElement("input");
        input.type = "radio";
        input.className = "selling-plans-widget__pill-input";
        input.name = this.pillName;
        input.value = String(plan.planId);
        input.autocomplete = "off";
        input.checked = index === 0;

        const span = document.createElement("span");
        span.className = "selling-plans-widget__pill-text";
        span.textContent = plan.shortLabel;

        lab.append(input, span);
        pillsRoot.appendChild(lab);
      });
    }

    const subMode = this.rootInner.querySelector(`#sp-mode-sub-${sectionId}`);
    const onceMode = this.rootInner.querySelector(`#sp-mode-once-${sectionId}`);
    if (subMode) subMode.checked = true;
    if (onceMode) onceMode.checked = false;

    this.rootInner.querySelector("[data-panel-subscribe]")?.classList.add("selling-plans-widget__panel--active");
    this.rootInner.querySelector("[data-panel-onetime]")?.classList.remove("selling-plans-widget__panel--active");

    const freq = this.rootInner.querySelector("[data-frequency-block]");
    if (freq) freq.hidden = false;

    const firstPill = this.rootInner.querySelector(`input[name="${this.pillName}"]`);
    if (firstPill) {
      firstPill.checked = true;
      this.applyPillSelection(firstPill);
    }

    this.emitChange(variantId);
  }
}

customElements.define("block-selling-plans", BlockSellingPlans);
