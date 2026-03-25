/**
 * capture-previews.mjs
 *
 * Screenshots each portfolio site and saves a JPEG thumbnail to public/previews/.
 * Run with:  npm run capture-previews
 * Force re-capture all: npm run capture-previews -- --force
 */

import puppeteer from 'puppeteer';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/previews');
const FORCE = process.argv.includes('--force');

const PROJECTS = [
  { filename: 'futureoflife.jpg',           url: 'https://futureoflife.org/' },
  { filename: 'superintelligence-statement.jpg', url: 'https://superintelligence-statement.org/' },
  { filename: 'control-inversion.jpg',      url: 'https://control-inversion.ai/' },
  { filename: 'curecancer.jpg',             url: 'https://curecancer.ai/' },
  { filename: 'ai-safety-index.jpg',        url: 'https://futureoflife.org/ai-safety-index-winter-2025/' },
  { filename: 'eu-ai-act.jpg',              url: 'https://artificialintelligenceact.eu/' },
  { filename: 'humanstatement.jpg',         url: 'https://humanstatement.org/' },
  { filename: 'global-governance.jpg',      url: 'https://global-governance.ai/' },
  { filename: 'aibasicact.jpg',             url: 'https://aibasicact.kr/' },
  { filename: 'replacement.jpg',            url: 'https://replacement.ai/' },
  { filename: 'keepthefuturehuman.jpg',     url: 'https://keepthefuturehuman.ai/' },
  { filename: 'christianailetter.jpg',      url: 'https://christianailetter.org/' },
  { filename: 'aisafetypriorities.jpg',     url: 'https://aisafetypriorities.org/' },
];

// Use a wider viewport so the scrollbar doesn't eat into the content area.
// The extra 20px means the visible content area is ~1280px once the browser
// reserves space for a scrollbar (~15–17px). Adjust if content still clips.
const VIEWPORT = { width: 1300, height: 800, deviceScaleFactor: 1 };
// Clip to exactly 1280×800 from the top-left — adjust CLIP_WIDTH/CLIP_HEIGHT
// here if you want a different aspect ratio in the thumbnails.
const CLIP_WIDTH  = 1280;
const CLIP_HEIGHT = 800;
const CLIP = { x: 0, y: 0, width: CLIP_WIDTH, height: CLIP_HEIGHT };

mkdirSync(OUT_DIR, { recursive: true });

console.log(`Capturing ${PROJECTS.length} previews → ${OUT_DIR}\n`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

let ok = 0;
let skipped = 0;
let failed = 0;

for (const { filename, url } of PROJECTS) {
  const outPath = resolve(OUT_DIR, filename);

  if (!FORCE && existsSync(outPath)) {
    console.log(`  skip  ${filename}  (already exists — use --force to re-capture)`);
    skipped++;
    continue;
  }

  process.stdout.write(`  fetch ${url} … `);

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
    // Hide scrollbars so they don't eat into the content area
    await page.addStyleTag({ content: '::-webkit-scrollbar { display: none !important } * { scrollbar-width: none !important }' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({
      path: outPath,
      type: 'jpeg',
      quality: 85,
      clip: CLIP,
    });

    console.log(`✓ saved ${filename}`);
    ok++;
  } catch (err) {
    console.log(`✗ failed — ${err.message}`);
    failed++;
  } finally {
    await page.close();
  }
}

await browser.close();

console.log(`\nDone: ${ok} captured, ${skipped} skipped, ${failed} failed.`);
if (failed > 0) process.exit(1);
