/**
 * Lumina Reader - Release Installer Copy Utility
 * 
 * Copies built Windows application installers and packages (NSIS .exe and MSI .msi)
 * from src-tauri/target/release/bundle/ into a dedicated root-level release/ directory.
 * Avoids collisions with the Vite dist/ web assets directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const bundleDir = path.join(rootDir, 'src-tauri', 'target', 'release', 'bundle');
const releaseDir = path.join(rootDir, 'release');

const TARGET_EXTENSIONS = new Set(['.exe', '.msi']);

function findInstallers(dir, installerList = []) {
  if (!fs.existsSync(dir)) return installerList;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findInstallers(fullPath, installerList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTENSIONS.has(ext)) {
        installerList.push({
          name: entry.name,
          fullPath,
          size: fs.statSync(fullPath).size,
        });
      }
    }
  }
  return installerList;
}

function copyReleaseInstallers() {
  console.log('📦 Starting Lumina Reader Installer Release Copy...\n');

  if (!fs.existsSync(bundleDir)) {
    console.log(`ℹ️ Bundle directory does not exist: ${bundleDir}`);
    console.log('   Run `npm run tauri build` to generate application installers first.');
    return;
  }

  const installers = findInstallers(bundleDir);

  if (installers.length === 0) {
    console.log(`⚠️ No .exe or .msi installers found in ${bundleDir}`);
    return;
  }

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
    console.log(`📁 Created release directory: ${path.relative(rootDir, releaseDir) || 'release'}`);
  }

  let copiedCount = 0;
  for (const item of installers) {
    const destPath = path.join(releaseDir, item.name);
    try {
      fs.copyFileSync(item.fullPath, destPath);
      const sizeMb = (item.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Copied: ${item.name} (${sizeMb} MB) -> release/${item.name}`);
      copiedCount++;
    } catch (err) {
      console.error(`❌ Failed to copy ${item.name}:`, err);
      process.exitCode = 1;
    }
  }

  console.log(`\n🎉 Successfully copied ${copiedCount} installer(s) to release/ directory.`);
}

copyReleaseInstallers();
