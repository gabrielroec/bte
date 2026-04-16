/**
 * Snapshot local theme changes so they can be restored after `shopify theme pull`.
 *
 * What it saves:
 * - Modified + untracked files (copies full contents into snapshot folder)
 * - Deleted files list (so restore can re-delete them)
 *
 * Usage:
 *   node scripts/snapshot-theme-changes.mjs
 *
 * Optional:
 * - If `theme-change-snapshots/include.txt` exists, it will snapshot those paths
 *   (even if git shows a clean working tree). This is useful when `shopify theme pull`
 *   would overwrite files but your git state is currently clean.
 *
 * Output:
 *   theme-change-snapshots/latest/**  (plus manifest.json)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = path.join(process.cwd());
const snapshotRoot = path.join(repoRoot, "theme-change-snapshots");
const latestDir = path.join(snapshotRoot, "latest");
const filesDir = path.join(latestDir, "files");
const manifestPath = path.join(latestDir, "manifest.json");
const includeListPath = path.join(snapshotRoot, "include.txt");

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha256File(absPath) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(absPath));
  return h.digest("hex");
}

function listStatusPorcelain() {
  // XY PATH (we ignore renames for now; Shopify pull should not rename)
  const out = run("git status --porcelain");
  if (!out.trim()) return [];
  return out
    .split(/\r?\n/g)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function readIncludeList() {
  if (!fs.existsSync(includeListPath)) return null;
  const raw = fs.readFileSync(includeListPath, "utf8");
  const lines = raw
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return lines.length ? lines : null;
}

function parseStatusLine(line) {
  // Examples:
  //  " M assets/components.css"
  //  "D  snippets/foo.liquid"
  //  "?? sections/new.liquid"
  const xy = line.slice(0, 2);
  const rest = line.slice(3).trim();
  return { xy, path: rest };
}

function rmDir(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function snapshot() {
  ensureDir(filesDir);

  const base = (() => {
    try {
      return run("git rev-parse HEAD");
    } catch {
      return null;
    }
  })();

  const modified = [];
  const added = [];
  const deleted = [];
  const skipped = [];

  const includeList = readIncludeList();
  const statusLines = includeList ? [] : listStatusPorcelain();

  if (includeList) {
    for (const rel of includeList) {
      if (rel.startsWith(".git/") || rel.includes("/.git/")) continue;
      if (rel.startsWith("theme-change-snapshots/")) continue;
      const abs = path.join(repoRoot, rel);
      if (!fs.existsSync(abs)) {
        skipped.push({ path: rel, reason: "missing_in_worktree" });
        continue;
      }
      if (!fs.statSync(abs).isFile()) {
        skipped.push({ path: rel, reason: "not_a_file" });
        continue;
      }

      const destAbs = path.join(filesDir, rel);
      ensureDir(path.dirname(destAbs));
      fs.copyFileSync(abs, destAbs);

      added.push({
        path: rel,
        bytes: fs.statSync(abs).size,
        sha256: sha256File(abs),
      });
    }
  } else {
    for (const line of statusLines) {
      const { xy, path: rel } = parseStatusLine(line);
      // Prefer the worktree state (second column) when present
      const code = xy[1] !== " " ? xy[1] : xy[0];

      if (!rel || rel.includes(" -> ")) {
        skipped.push({ line, reason: "rename_or_unknown_format" });
        continue;
      }

      if (rel.startsWith(".git/") || rel.includes("/.git/")) continue;
      if (rel.startsWith("theme-change-snapshots/")) continue;

      const abs = path.join(repoRoot, rel);
      if (code === "D") {
        deleted.push(rel);
        continue;
      }

      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        skipped.push({ path: rel, reason: "not_a_file_or_missing" });
        continue;
      }

      const destAbs = path.join(filesDir, rel);
      ensureDir(path.dirname(destAbs));
      fs.copyFileSync(abs, destAbs);

      const entry = {
        path: rel,
        bytes: fs.statSync(abs).size,
        sha256: sha256File(abs),
      };

      if (xy === "??") {
        added.push(entry);
      } else {
        modified.push(entry);
      }
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    baseGitHead: base,
    mode: includeList ? "include_list" : "git_status",
    includeListPath: includeList ? "theme-change-snapshots/include.txt" : null,
    modified,
    added,
    deleted,
    skipped,
    totals: {
      modified: modified.length,
      added: added.length,
      deleted: deleted.length,
      skipped: skipped.length,
    },
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return manifest;
}

// Reset latest snapshot folder then recreate
ensureDir(snapshotRoot);
rmDir(latestDir);
ensureDir(filesDir);

const manifest = snapshot();
process.stdout.write(
  `Snapshot pronto: theme-change-snapshots/latest (modificados=${manifest.totals.modified}, novos=${manifest.totals.added}, deletados=${manifest.totals.deleted})\n`
);

