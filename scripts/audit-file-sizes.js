/**
 * Lumina Reader - Codebase Modular Size Audit Script
 * Verifies strict file size discipline:
 * - HARD LIMIT: <= 350 lines (strictly enforced across all code files)
 * - TARGET: 150 - 250 lines (warns if file exceeds 300 lines)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const TARGET_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.rs', '.css']);
const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'target',
  'gen',
  '.git',
  '.system_generated',
  'assets',
]);

const WARNING_THRESHOLD = 300;
const HARD_LIMIT = 350;


function scanDirectory(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split(/\r?\n/).length;
}

function runAudit() {
  console.log('🔍 Starting Lumina Reader Codebase Modular Size Audit...\n');

  const srcDir = path.join(rootDir, 'src');
  const tauriSrcDir = path.join(rootDir, 'src-tauri', 'src');

  const filesToScan = [
    ...scanDirectory(srcDir),
    ...(fs.existsSync(tauriSrcDir) ? scanDirectory(tauriSrcDir) : []),
  ];

  const records = [];
  let violations = 0;
  let warnings = 0;

  for (const file of filesToScan) {
    const lines = countLines(file);
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');
    records.push({ filePath: file, relativePath: rel, lines });

    if (lines > HARD_LIMIT) {
      violations++;
      console.error(`❌ VIOLATION (> ${HARD_LIMIT} lines): ${rel} (${lines} lines)`);
    } else if (lines > WARNING_THRESHOLD) {
      warnings++;
      console.warn(`⚠️  WARNING (> ${WARNING_THRESHOLD} lines): ${rel} (${lines} lines)`);
    }
  }

  records.sort((a, b) => b.lines - a.lines);

  console.log('\n📊 Top 10 Largest Files in Codebase:');
  records.slice(0, 10).forEach((rec, idx) => {
    const badge = rec.lines > HARD_LIMIT ? '❌' : rec.lines > WARNING_THRESHOLD ? '⚠️ ' : '✅';
    console.log(`  ${idx + 1}. ${badge} ${rec.relativePath.padEnd(55)} : ${rec.lines} lines`);
  });

  const totalFiles = records.length;
  const totalLines = records.reduce((sum, r) => sum + r.lines, 0);
  const avgLines = Math.round(totalLines / totalFiles);

  console.log('\n------------------------------------------------------------');
  console.log(`📈 Total Monitored Files: ${totalFiles}`);
  console.log(`📄 Total Lines of Code:   ${totalLines}`);
  console.log(`📏 Average Lines/File:    ${avgLines} lines`);
  console.log(`⚠️  Warnings (> 300):      ${warnings}`);
  console.log(`❌ Violations (> 350):    ${violations}`);
  console.log('------------------------------------------------------------\n');

  if (violations > 0) {
    console.error(`🚨 FAILED: Found ${violations} file(s) exceeding the hard limit of ${HARD_LIMIT} lines.`);
    process.exit(1);
  } else {
    console.log(`✨ PASSED: All ${totalFiles} code files are strictly within the ${HARD_LIMIT}-line boundary!`);
  }
}

runAudit();
