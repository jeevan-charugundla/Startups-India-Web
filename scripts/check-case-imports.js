#!/usr/bin/env node
/**
 * check-case-imports.js
 * ---------------------
 * Scans every .js file under backend/src for require('…') calls that use
 * relative paths, then verifies each resolved file name matches the ACTUAL
 * file on disk **case-sensitively**.
 *
 * On Windows this catches bugs that would only surface on Linux (EC2).
 * In CI (Linux) it catches them before they ever reach production.
 *
 * Exit code:
 *   0 - all imports match
 *   1 - at least one case-mismatch found
 *
 * Usage:
 *   node scripts/check-case-imports.js
 */

const fs = require('fs');
const path = require('path');

const BACKEND_SRC = path.resolve(__dirname, '..', 'backend', 'src');
const EXTENSIONS = ['.js', '.json', '.node']; // Node require resolution order

let errors = 0;
let filesScanned = 0;

/**
 * Recursively collect all .js files under `dir`.
 */
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      files.push(...walk(full));
    } else if (e.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Check whether each segment of `resolvedPath` matches the ACTUAL casing on
 * disk by comparing against readdirSync results.
 */
function caseMatches(resolvedPath) {
  const segments = resolvedPath.split(path.sep);
  let current = segments[0] + path.sep; // drive letter on Windows, / on Linux

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;

    try {
      const entries = fs.readdirSync(current);
      const match = entries.find((e) => e === seg);
      if (!match) {
        // Check if it exists with different case
        const ciMatch = entries.find(
          (e) => e.toLowerCase() === seg.toLowerCase(),
        );
        if (ciMatch) {
          return {
            ok: false,
            expected: ciMatch,
            got: seg,
            dir: current,
          };
        }
        // File genuinely doesn't exist (maybe it gets added at runtime)
        return { ok: true };
      }
      current = path.join(current, match);
    } catch {
      // Directory doesn't exist - skip
      return { ok: true };
    }
  }
  return { ok: true };
}

/**
 * Resolve a require specifier the way Node does (file, file+ext, dir/index).
 */
function tryResolve(base, specifier) {
  const abs = path.resolve(base, specifier);

  // 1. Exact file
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;

  // 2. With extensions
  for (const ext of EXTENSIONS) {
    const withExt = abs + ext;
    if (fs.existsSync(withExt)) return withExt;
  }

  // 3. Directory with index
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const idx = path.join(abs, 'index' + ext);
      if (fs.existsSync(idx)) return idx;
    }
  }

  return null;
}

// ── Main ───────────────────────────────────────────────────────────────
const allFiles = walk(BACKEND_SRC);

for (const file of allFiles) {
  filesScanned++;
  const content = fs.readFileSync(file, 'utf8');

  // Match require('./…') and require('../…')
  const re = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const specifier = m[1];
    const dir = path.dirname(file);
    const resolved = tryResolve(dir, specifier);

    if (!resolved) {
      // Module not found at all - Node will throw at runtime regardless of OS
      const lineNum =
        content.substring(0, m.index).split('\n').length;
      console.error(
        `❌ MISSING MODULE: ${path.relative(BACKEND_SRC, file)}:${lineNum}`,
      );
      console.error(`   require('${specifier}') → file not found\n`);
      errors++;
      continue;
    }

    const result = caseMatches(resolved);
    if (!result.ok) {
      const lineNum =
        content.substring(0, m.index).split('\n').length;
      console.error(
        `❌ CASE MISMATCH: ${path.relative(BACKEND_SRC, file)}:${lineNum}`,
      );
      console.error(
        `   require('${specifier}') → used "${result.got}" but file is "${result.expected}"`,
      );
      console.error(`   in directory: ${result.dir}\n`);
      errors++;
    }
  }
}

console.log(`\nScanned ${filesScanned} files.`);
if (errors > 0) {
  console.error(`\n💥 ${errors} case-sensitivity issue(s) found!`);
  console.error(
    'These will work on Windows but CRASH on Linux (EC2). Fix them before deploying.\n',
  );
  process.exit(1);
} else {
  console.log('✅ All require() imports match actual file casing.\n');
  process.exit(0);
}
