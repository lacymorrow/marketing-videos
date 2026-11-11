import { chromium } from '/opt/homebrew/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const out = '../../portfolio/profile-kit'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: fs.readFileSync('chrome-path.txt','utf8').trim() });
for (const [a, w] of [['16x9',1920],['1x1',1080]]) {
  const p = await b.newPage({ viewport: { width: w, height: 1080 } });
  await p.goto('https://ai-profile-pic.vercel.app', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  await p.screenshot({ path: `${out}/profile-kit-home-${a}.png` });
}
await b.close();
