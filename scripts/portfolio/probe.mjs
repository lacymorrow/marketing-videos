import { chromium } from '/opt/homebrew/lib/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
const sites = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME });
for (const u of sites) {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    await p.goto(u, { waitUntil: 'networkidle', timeout: 30000 });
    const t = await p.title();
    const links = await p.$$eval('a[href]', as => [...new Set(as.map(a => a.textContent.trim().slice(0,30) + ' -> ' + a.getAttribute('href')))].slice(0, 25));
    console.log('##', u, t, '\n' + links.join('\n'));
  } catch (e) { console.log('##', u, 'ERR', e.message.slice(0,100)); }
}
await b.close();
