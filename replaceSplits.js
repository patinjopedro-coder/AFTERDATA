// replaceSplits.js
// Script to replace unsafe .split() calls with safeSplit across the src directory.

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '.');
const srcDir = path.join(projectRoot, 'src');

function getAllFiles(dir, exts, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(full, exts, list);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      list.push(full);
    }
  }
  return list;
}

function ensureImport(content, importPath) {
  const importStatement = `import { safeSplit } from '${importPath}';`;
  if (content.includes('safeSplit')) return content; // already imported
  const importRegex = /(import[^;]+;\s*)$/m;
  const match = content.match(importRegex);
  if (match) {
    const pos = match.index + match[0].length;
    return content.slice(0, pos) + '\n' + importStatement + content.slice(pos);
  }
  return importStatement + '\n' + content;
}

function replaceInFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // variable.split(sep) -> safeSplit(variable, sep)
  src = src.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\.split\(([^)]+)\)/g, (m, v, sep) => `safeSplit(${v}, ${sep.trim()})`);

  // String(expr).split(sep) -> safeSplit(expr, sep)
  src = src.replace(/String\(([^)]+)\)\.split\(([^)]+)\)/g, (m, expr, sep) => `safeSplit(${expr.trim()}, ${sep.trim()})`);

  // Add import relative to utils.ts
  const rel = path.relative(path.dirname(filePath), path.join(srcDir, 'utils')).replace(/\\/g, '/');
  const importPath = rel.startsWith('.') ? rel : './' + rel;
  src = ensureImport(src, importPath);

  if (src !== original) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const files = getAllFiles(srcDir, ['.ts', '.tsx']);
files.forEach(replaceInFile);

console.log('All .split() calls have been replaced with safeSplit where possible.');
