import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Rasterize our original vector mark; no third-party artwork or network requests.
await mkdir('build/icon.iconset', { recursive: true });
const svg = await readFile('public/brand/icon.svg', 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const size of [16, 32, 64, 128, 256, 512, 1024]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
    const png = await page.screenshot({ omitBackground: true });
    if (size <= 512) await writeFile(`build/icon.iconset/icon_${size}x${size}.png`, png);
    if (size >= 32) await writeFile(`build/icon.iconset/icon_${size / 2}x${size / 2}@2x.png`, png);
    if (size === 512) await writeFile('build/icon.png', png);
    if (size === 256) {
      const header = Buffer.alloc(22);
      header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
      header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
      header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
      await writeFile('build/icon.ico', Buffer.concat([header, png]));
    }
  }
} finally { await browser.close(); }
if (process.platform === 'darwin') execFileSync('iconutil', ['-c', 'icns', 'build/icon.iconset', '-o', 'build/icon.icns']);
console.log('Generated Zettel application icons from public/brand/icon.svg');
