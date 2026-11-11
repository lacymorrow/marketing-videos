// Real-product capture for LAC-7696. Usage: node capture.mjs <product> <16x9|1x1>
import { chromium } from '/opt/homebrew/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
import fs from 'fs';
import path from 'path';
const [product, aspect] = process.argv.slice(2);
const OUT = path.resolve('../../portfolio', product);
const TMP = `/tmp/vp7696/${product}-${aspect}`;
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const size = aspect === '1x1' ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 };
const b = await chromium.launch({ executablePath: fs.readFileSync('chrome-path.txt', 'utf8').trim() });
const ctx = await b.newContext({ viewport: size, recordVideo: { dir: TMP, size }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => { if (location.hostname.includes('resume')) { const st = document.createElement('style'); st.textContent = 'a[href^="tel:"]{visibility:hidden!important}'; (document.head || document.documentElement).appendChild(st); new MutationObserver(() => { if (!st.isConnected) (document.head || document.documentElement).appendChild(st); }).observe(document, { childList: true, subtree: true }); } });
const p = await ctx.newPage();
const t0 = Date.now();
let startOffset = 0;
const shot = async (name) => p.screenshot({ path: path.join(OUT, `${product}-${name}-${aspect}.png`) });
const hidePII = () => p.addStyleTag({ content: 'a[href^="tel:"]{visibility:hidden!important}' });
const open = async (u) => { await p.goto(u, { waitUntil: 'networkidle' }); if (u.includes('resume')) await hidePII(); await p.waitForTimeout(800); if (!startOffset) startOffset = (Date.now() - t0) / 1000 + (u.includes('resume') ? 0.6 : -0.3); };
const glide = async (px, steps = 30, ms = 60) => { for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, px / steps); await p.waitForTimeout(ms); } };
const flows = {
  buildandserve: async () => {
    await open('https://buildandserve.com'); await shot('home');
    await p.waitForTimeout(1500); await glide(900); await p.waitForTimeout(1200); await glide(900); await p.waitForTimeout(1000);
    await p.goto('https://buildandserve.com/work/credit-karma', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200); await shot('case-credit-karma');
    await glide(1000, 40); await p.waitForTimeout(1500);
  },
  uibrary: async () => {
    await open('https://uibrary.com'); await shot('home');
    await p.waitForTimeout(1500); await glide(800); await p.waitForTimeout(1000);
    await p.goto('https://uibrary.com/components/aceternity/3d-card', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await shot('component-3d-card');
    await p.mouse.move(size.width / 2, size.height / 2.2); for (let i = 0; i < 40; i++) { await p.mouse.move(size.width / 2 + Math.cos(i / 6) * 250, size.height / 2.2 + Math.sin(i / 6) * 150); await p.waitForTimeout(80); }
    await p.waitForTimeout(1000);
  },
  cliphub: async () => {
    await open('https://cliphub.fyi'); await shot('browse');
    await p.waitForTimeout(1500); await glide(700); await p.waitForTimeout(800);
    await p.goto('https://cliphub.fyi/?category=tools', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    await p.goto('https://cliphub.fyi/plugins/paperclipai-plugin-e2b', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await shot('plugin-install');
    await glide(500); await p.waitForTimeout(1500);
  },
  fpvbible: async () => {
    await open('https://fpv-bible.lacy.sh'); await shot('home');
    await p.waitForTimeout(1500);
    await p.goto('https://fpv-bible.lacy.sh/getting-started/introduction/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200); await shot('guide-introduction');
    await glide(1400, 50); await p.waitForTimeout(1200);
  },
  resume: async () => {
    await open('https://resume.lacy.sh/frontend'); await hidePII(); await shot('home');
    await p.waitForTimeout(1200); await glide(900); await p.waitForTimeout(800);
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' })); await p.waitForTimeout(1200);
    await p.getByText('CUSTOMIZE').first().click(); await p.waitForTimeout(1500); await shot('builder');
    for (const l of ['Volunteering', 'Certificates', 'Languages']) { await p.getByText(l, { exact: true }).first().click().catch(() => {}); await p.waitForTimeout(900); }
    for (const t of ['React', 'Next.js', 'TypeScript']) { await p.getByRole('button', { name: t, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(1100); }
    await shot('builder-filtered'); await p.waitForTimeout(800);
    await glide(900, 40); await p.waitForTimeout(1000);
  },
};
await flows[product]();
while ((Date.now() - t0) / 1000 - startOffset < 17) { await glide(300, 10, 80); await p.waitForTimeout(600); await glide(-300, 10, 80); await p.waitForTimeout(600); }
await ctx.close(); await b.close();
const vid = fs.readdirSync(TMP).find(f => f.endsWith('.webm'));
const dst = path.join(OUT, `${product}-clip-${aspect}.mp4`);
const r = (await import('child_process')).spawnSync('ffmpeg', ['-y', '-ss', String(startOffset), '-i', path.join(TMP, vid), '-vf', `fps=30,scale=${size.width}:${size.height}`, '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', dst], { encoding: 'utf8' });
console.log(product, aspect, r.status, 'startOffset', startOffset);
