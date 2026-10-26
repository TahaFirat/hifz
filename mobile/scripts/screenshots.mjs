// App Store screenshot generator for Hıfz via Chrome DevTools Protocol + Sharp (24-bit RGB, no alpha).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sharp = require(path.resolve(root, '../node_modules/sharp'));

const storeRoots = [
  path.resolve(root, '../app_store_assets'),
  path.resolve(root, '../../app_store_assets'),
];

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Exact Apple App Store Connect resolutions:
const devices = [
  { name: '1_iPhone_Dynamic_Island_1179x2556', width: 393, height: 852, scale: 3, mobile: true },
  { name: '2_iPhone_16_Pro_1206x2622', width: 402, height: 874, scale: 3, mobile: true },
  { name: '3_iPad_13_inch_2064x2752', width: 1032, height: 1376, scale: 2, mobile: true },
  { name: '6.7_inch_portrait', width: 430, height: 932, scale: 3, mobile: true },
  { name: '6.5_inch_portrait', width: 414, height: 896, scale: 3, mobile: true },
  { name: 'ipad_portrait', width: 1024, height: 1366, scale: 2, mobile: true },
];

// Start vite preview server
const previewPort = 4179;
const BASE = `http://127.0.0.1:${previewPort}`;
const previewProc = spawn(
  process.execPath,
  [path.resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(previewPort), '--host', '127.0.0.1'],
  { cwd: root, stdio: 'ignore' }
);

const cdpPort = 9344;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hifz-shot-'));
const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

let ws, id = 0;
const pending = new Map();
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((res, rej) => pending.set(msgId, { res, rej }));
}
async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.value;
}
async function waitFor(expr, timeout = 20000) {
  const t = Date.now();
  while (Date.now() - t < timeout) {
    if (await evaluate(expr)) return true;
    await sleep(150);
  }
  throw new Error('timeout: ' + expr);
}
async function shot(deviceName, fileName, bgHex = '#070b10') {
  await sleep(500);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const rawBuf = Buffer.from(data, 'base64');
  // Flatten to 24-bit RGB without alpha channel (strictly required by App Store Connect)
  const cleanBuf = await sharp(rawBuf).flatten({ background: bgHex }).removeAlpha().png().toBuffer();
  for (const storeRoot of storeRoots) {
    const dir = path.join(storeRoot, deviceName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, fileName), cleanBuf);
  }
  console.log('  saved', deviceName, fileName);
}
async function go(url) {
  await send('Page.navigate', { url });
  await sleep(350);
  await waitFor('document.readyState==="complete"');
  await sleep(450);
}

try {
  // Wait for preview server
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(BASE);
      if (r.ok) break;
    } catch {}
    await sleep(200);
  }

  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json()).find((t) => t.type === 'page');
    } catch {
      await sleep(200);
    }
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)[m.error ? 'rej' : 'res'](m.error || m.result);
      pending.delete(m.id);
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');

  for (const d of devices) {
    console.log('Capturing device:', d.name);
    await send('Emulation.setDeviceMetricsOverride', {
      width: d.width,
      height: d.height,
      deviceScaleFactor: d.scale,
      mobile: d.mobile,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

    // Seed realistic study data for Home & Workshop
    await go(BASE + '/');
    await evaluate(`(() => {
      localStorage.clear();
      localStorage.setItem('hifz:theme', 'dark');
      localStorage.setItem('hifz:last-lesson:v1', JSON.stringify({
        key: 's1',
        name: 'Fâtiha',
        category: 'basics',
        range: [1, 7]
      }));
      const now = Date.now();
      localStorage.setItem('hifz:reviews:v1', JSON.stringify({
        'quran:1:1': { id: 'quran:1:1', key: 's1', category: 'basics', name: 'Fâtiha', verse: 1, rating: 'solid', streak: 3, updated: now - 3600000, due: now + 86400000 },
        'quran:1:2': { id: 'quran:1:2', key: 's1', category: 'basics', name: 'Fâtiha', verse: 2, rating: 'solid', streak: 2, updated: now - 3600000, due: now + 86400000 },
        'quran:1:3': { id: 'quran:1:3', key: 's1', category: 'basics', name: 'Fâtiha', verse: 3, rating: 'learning', streak: 1, updated: now - 1800000, due: now - 60000 },
        'quran:2:255': { id: 'quran:2:255', key: 'k255', category: 'basics', name: 'Âyetel Kürsî', verse: 255, rating: 'learning', streak: 1, updated: now - 7200000, due: now + 43200000 },
        'prayer:subhaneke:1': { id: 'prayer:subhaneke:1', key: 'subhaneke', category: 'prayers', name: 'Sübhaneke', verse: 1, rating: 'solid', streak: 4, updated: now - 86400000, due: now + 172800000 }
      }));
      return true;
    })()`);

    // 1. Home screen with Ezber Haritam open
    await go(BASE + '/');
    await evaluate(`(() => {
      const btn = document.querySelector('.map-toggle');
      if (btn) btn.click();
      window.scrollTo(0, 0);
      return true;
    })()`);
    await shot(d.name, '01_ana_sayfa_plan.png', '#070b10');

    // 2. Fâtiha Suresi — Adaptive Phrase Cards (Duraklar)
    await go(BASE + '/calis?kategori=basics&icerik=s1');
    await waitFor(`document.querySelectorAll('.verse-card').length > 2`);
    await shot(d.name, '02_fatiha_duraklar.png', '#070b10');

    // 3. Progressive Cue Masking (İlk Kelime & Boşluk Doldur)
    await evaluate(`(() => {
      const lvlButtons = document.querySelectorAll('.levels button');
      if (lvlButtons[1]) lvlButtons[1].click();
      return true;
    })()`);
    await sleep(250);
    await evaluate(`(() => {
      const cards = document.querySelectorAll('.verse-card .meaning-anchor');
      if (cards[0]) cards[0].click();
      window.scrollTo(0, 0);
      return true;
    })()`);
    await shot(d.name, '03_ipucu_kademeli_gizleme.png', '#070b10');

    // 4. Osmanlı 3+3 & Rabt (Hafız Koçu) + VerseReview open
    await evaluate(`(() => {
      const sel = document.querySelector('#method-select');
      if (sel) {
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
        setter.call(sel, 'coach');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    })()`);
    await sleep(300);
    await evaluate(`(() => {
      const det = document.querySelector('details.verse-review');
      if (det) det.open = true;
      window.scrollTo(0, 0);
      return true;
    })()`);
    await shot(d.name, '04_hafiz_kocu_3plus3.png', '#070b10');

    // 5. Tecvit & Mahreç Laboratuvarı Tab
    await go(BASE + '/?sekme=tecvit');
    await sleep(350);
    await shot(d.name, '05_siralama_kopru_testi.png', '#061412');

    // 6. Ezber Karnem & Günlük iOS Hatırlatıcı Tab
    await evaluate(`(() => {
      localStorage.setItem('hifz:ios-reminder:v1', '1');
      localStorage.setItem('hifz:ios-reminder-hour:v1', '20');
      return true;
    })()`);
    await go(BASE + '/?sekme=karne');
    await sleep(350);
    await shot(d.name, '06_namaz_dualari_acik_tema.png', '#061412');
  }
  console.log('All 36 App Store screenshots generated successfully!');
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  try { chrome.kill(); } catch {}
  try { previewProc.kill(); } catch {}
}
