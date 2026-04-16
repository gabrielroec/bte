/**
 * Restore the latest snapshot created by `scripts/snapshot-theme-changes.mjs`.
 *
 * Usage:
 *   node scripts/restore-theme-changes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.join(process.cwd());
const latestDir = path.join(repoRoot, "theme-change-snapshots", "latest");
const filesDir = path.join(latestDir, "files");
const manifestPath = path.join(latestDir, "manifest.json");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(srcDir, destRoot) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const srcAbs = path.join(srcDir, ent.name);
    const rel = path.relative(filesDir, srcAbs);
    const destAbs = path.join(destRoot, rel);
    if (ent.isDirectory()) {
      ensureDir(destAbs);
      copyDir(srcAbs, destRoot);
    } else if (ent.isFile()) {
      ensureDir(path.dirname(destAbs));
      fs.copyFileSync(srcAbs, destAbs);
    }
  }
}

function restore() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Não encontrei manifest.json em theme-change-snapshots/latest. Rode primeiro o snapshot.");
  }
  if (!fs.existsSync(filesDir)) {
    throw new Error("Não encontrei a pasta files/ no snapshot. Rode novamente o snapshot.");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // 1) Copy back all files
  copyDir(filesDir, repoRoot);

  // 2) Re-apply deletions (if any)
  const deleted = Array.isArray(manifest.deleted) ? manifest.deleted : [];
  for (const rel of deleted) {
    if (!rel || typeof rel !== "string") continue;
    const abs = path.join(repoRoot, rel);
    if (fs.existsSync(abs)) {
      try {
        fs.rmSync(abs, { force: true });
      } catch {
        // ignore
      }
    }
  }

  return manifest;
}

const manifest = restore();
process.stdout.write(
  `Restore concluído: arquivos copiados=${(manifest.modified?.length || 0) + (manifest.added?.length || 0)}, deletados=${manifest.deleted?.length || 0}\n`
);

