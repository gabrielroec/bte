/**
 * Sincroniza a secção `main` (primeiro fold) de product.glow-face-mask.json
 * com os demais templates product*.json, preservando texto + lista custom quando possível.
 *
 * Uso: node scripts/sync-pdp-main-section.mjs
 */

import fs from "fs";
import path from "fs/promises";
import pathMod from "path";
import { fileURLToPath } from "url";

const __dirname = pathMod.dirname(fileURLToPath(import.meta.url));
const ROOT = pathMod.join(__dirname, "..");
const TEMPLATES = pathMod.join(ROOT, "templates");
const REF_FILE = pathMod.join(TEMPLATES, "product.glow-face-mask.json");

const HEADER = `/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */
`;

function stripLeadingComment(raw) {
  return raw.replace(/^\/\*[\s\S]*?\*\/\s*/, "").trim();
}

function parseThemeJson(raw) {
  const stripped = stripLeadingComment(raw);
  return JSON.parse(stripped);
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function findBlocksByType(main, type) {
  if (!main?.blocks) return [];
  return Object.entries(main.blocks).filter(([, b]) => b.type === type);
}

function findCustomListBlock(main) {
  if (!main?.blocks) return null;
  for (const [id, b] of Object.entries(main.blocks)) {
    if (b.type !== "custom") continue;
    const code = b.settings?.code || "";
    if (code.includes("product-custom-list") || code.includes("<ul")) {
      return { id, block: b };
    }
  }
  return null;
}

const GENERIC_SUBTITLE =
  "Discover premium skincare—details and how to use are in the sections below.";
const GENERIC_BULLETS = `<ul class="product-custom-list">
<li>Premium formulas designed for visible results</li>
<li>See ingredients, how to apply, and more below</li>
<li>Free shipping on qualifying orders</li>
</ul>`;

function mergeFromOldMain(canonical, oldMain) {
  if (!canonical.blocks?.text_WgiafR) return;

  const textBlocks = findBlocksByType(oldMain, "text");
  if (textBlocks.length) {
    const t = textBlocks[0][1].settings?.text;
    if (t && String(t).trim()) {
      canonical.blocks.text_WgiafR.settings.text = t;
    } else {
      canonical.blocks.text_WgiafR.settings.text = GENERIC_SUBTITLE;
    }
  } else {
    canonical.blocks.text_WgiafR.settings.text = GENERIC_SUBTITLE;
  }

  if (!canonical.blocks?.custom_eYcXWC) return;

  const oldList = findCustomListBlock(oldMain);
  if (oldList?.block?.settings?.code?.trim()) {
    canonical.blocks.custom_eYcXWC.settings.code = oldList.block.settings.code;
  } else {
    canonical.blocks.custom_eYcXWC.settings.code = GENERIC_BULLETS;
  }
}

async function main() {
  const refRaw = await fs.promises.readFile(REF_FILE, "utf8");
  const refData = parseThemeJson(refRaw);
  const canonical = refData.sections?.main;
  if (!canonical || canonical.type !== "main-product") {
    console.error("Referência inválida:", REF_FILE);
    process.exit(1);
  }

  const files = await fs.promises.readdir(TEMPLATES);
  const jsonFiles = files.filter(
    (f) =>
      f.startsWith("product") &&
      f.endsWith(".json") &&
      !f.includes(".context.")
  );

  const skip = new Set(["product.glow-face-mask.json", "product.gift-card.json"]);

  let updated = 0;
  for (const name of jsonFiles) {
    if (skip.has(name)) continue;

    const filePath = pathMod.join(TEMPLATES, name);
    let raw;
    try {
      raw = await fs.promises.readFile(filePath, "utf8");
    } catch (e) {
      console.warn("Skip (read error):", name);
      continue;
    }

    let data;
    try {
      data = parseThemeJson(raw);
    } catch (e) {
      console.warn("Skip (parse error):", name, e.message);
      continue;
    }

    if (!data.sections?.main || data.sections.main.type !== "main-product") {
      console.log("Skip (no main-product):", name);
      continue;
    }

    const oldMain = data.sections.main;
    const nextMain = deepClone(canonical);
    mergeFromOldMain(nextMain, oldMain);
    data.sections.main = nextMain;

    const out = HEADER + "\n" + JSON.stringify(data, null, 2) + "\n";
    await fs.promises.writeFile(filePath, out, "utf8");
    console.log("OK:", name);
    updated++;
  }

  console.log("\nAtualizados:", updated, "templates (referência:", REF_FILE, ")");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
