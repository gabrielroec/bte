import { EVENTS } from "@archetype-themes/utils/events";
import { formatMoney } from "@archetype-themes/utils/currency";

function deliveriesPerYearFromLabel(shortLabel) {
  const s = (shortLabel || "").toLowerCase();
  const monthMatch = s.match(/(\d+)\s*months?/);
  if (monthMatch) {
    const n = Math.max(1, parseInt(monthMatch[1], 10));
    return Math.round(12 / n);
  }
  const weekMatch = s.match(/(\d+)\s*weeks?/);
  if (weekMatch) {
    const n = Math.max(1, parseInt(weekMatch[1], 10));
    return Math.round(52 / n);
  }
  const dayMatch = s.match(/(\d+)\s*days?/);
  if (dayMatch) {
    const n = Math.max(1, parseInt(dayMatch[1], 10));
    return Math.round(365 / n);
  }
  if (s.includes("month")) return 12;
  if (s.includes("week")) return 52;
  if (s.includes("day")) return 365;
  return 12;
}

function getCheckedRadioValue(root, name) {
  if (!root || !name) return null;
  const inputs = root.querySelectorAll('input[type="radio"]');
  for (const el of inputs) {
    if (el.name === name && el.checked) return el.value;
  }
  return null;
}

class BlockSubscriptionSavings extends HTMLElement {
  constructor() {
    super();
    this.update = this.update.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.onSellingPlansChange = this.onSellingPlansChange.bind(this);
    this.onDocumentChange = this.onDocumentChange.bind(this);
  }

  connectedCallback() {
    this.abortController = new AbortController();
    const configEl = this.querySelector("[data-subscription-savings-config]");
    if (!configEl) return;
    try {
      this.config = JSON.parse(configEl.textContent);
    } catch {
      return;
    }
    this.moneyFormat = this.config.moneyFormat || "${{amount}}";
    this.lineOrderEl = this.querySelector("[data-line-order]");
    this.lineYearEl = this.querySelector("[data-line-year]");

    document.addEventListener(`${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`, this.handleVariantChange, {
      signal: this.abortController.signal,
    });
    document.addEventListener("selling-plans:change", this.onSellingPlansChange, {
      signal: this.abortController.signal,
    });
    document.addEventListener("change", this.onDocumentChange, {
      signal: this.abortController.signal,
      capture: true,
    });

    queueMicrotask(() => this.update());
    requestAnimationFrame(() => this.update());
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  onDocumentChange(e) {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "radio") return;
    const selling = this.getSellingPlansBlock();
    if (!selling?.contains(t)) return;
    const mode = this.config.modeName;
    const pill = this.config.pillName;
    if ((mode && t.name === mode) || (pill && t.name === pill)) {
      queueMicrotask(() => this.update());
    }
  }

  handleVariantChange(e) {
    const variant = e.detail?.variant;
    if (variant) this.variantId = String(variant.id);
    this.update();
  }

  onSellingPlansChange(e) {
    const d = e.detail;
    if (!d) return;
    if (String(d.sectionId) !== String(this.dataset.sectionId)) return;
    if (String(d.productId) !== String(this.dataset.productId)) return;
    queueMicrotask(() => this.update());
  }

  getSellingPlansBlock() {
    const sid = String(this.dataset.sectionId ?? "");
    const pid = String(this.dataset.productId ?? "");
    return document.querySelector(`block-selling-plans[data-section-id="${sid}"][data-product-id="${pid}"]`);
  }

  getVariantId() {
    return this.variantId || document.querySelector(`#product-form-${this.dataset.sectionId} input[name="id"]`)?.value || null;
  }

  setVisible(show) {
    if (show) {
      this.removeAttribute("hidden");
      this.style.removeProperty("display");
    } else {
      this.setAttribute("hidden", "");
      this.style.setProperty("display", "none", "important");
    }
    this.setAttribute("aria-hidden", show ? "false" : "true");
  }

  isSubscribeMode(root) {
    const modeName = this.config.modeName;
    if (modeName) {
      return getCheckedRadioValue(root, modeName) === "subscribe";
    }
    const legacy = root.querySelector('input[type="radio"][name^="purchase_mode_"]:checked');
    return legacy?.value === "subscribe";
  }

  update() {
    const vid = this.getVariantId();
    const v = vid && this.config.variants ? this.config.variants[vid] : null;
    if (!v || !Array.isArray(v.allocations) || v.allocations.length === 0) {
      this.setVisible(false);
      return;
    }

    const selling = this.getSellingPlansBlock();
    if (!selling) {
      this.setVisible(false);
      return;
    }

    const root = selling.querySelector("[data-selling-plans-root]");
    if (!root) {
      this.setVisible(false);
      return;
    }

    if (!this.isSubscribeMode(root)) {
      this.setVisible(false);
      return;
    }

    const pillName = this.config.pillName;
    let subCents = null;
    let shortLabel = "";

    if (pillName) {
      const planId = getCheckedRadioValue(root, pillName);
      if (planId != null && planId !== "") {
        const alloc = v.allocations.find((a) => String(a.planId) === String(planId));
        if (alloc) {
          subCents = alloc.priceCents;
          shortLabel = alloc.shortLabel || "";
        }
      }
    }

    if (subCents == null) {
      this.setVisible(false);
      return;
    }

    const onetimeCents = v.onetimeCents;
    if (subCents >= onetimeCents) {
      this.setVisible(false);
      return;
    }

    const saveOrder = Math.max(0, onetimeCents - subCents);
    if (saveOrder <= 0) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);

    const perYear = Math.round(saveOrder * deliveriesPerYearFromLabel(shortLabel));

    const orderStr = formatMoney(saveOrder, this.moneyFormat, false);
    const yearStr = formatMoney(perYear, this.moneyFormat, false);

    const lineOrder = (this.config.lineOrder || "").replace(/\[\[amount\]\]/g, orderStr);
    const lineYear = (this.config.lineYear || "").replace(/\[\[amount\]\]/g, yearStr);

    if (this.lineOrderEl) this.lineOrderEl.textContent = lineOrder;
    if (this.lineYearEl) this.lineYearEl.textContent = lineYear;
  }
}

customElements.define("block-subscription-savings", BlockSubscriptionSavings);
