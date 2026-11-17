// Dựng toàn bộ bộ emoji: PNG tĩnh 100x100, WEBM động 100x100, ảnh xem trước, manifest.
// Chạy: node src/build.mjs
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMOJI, GROUPS, C } from './emoji.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const STATIC = path.join(DIST, 'static');
const VIDEO = path.join(DIST, 'video');
const FRAMES = path.join(ROOT, '.frames');
const FONT = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf';
const FPS = 30;
const SECONDS = 2;

for (const d of [STATIC, VIDEO]) {
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d, { recursive: true });
}

const FIT_JS = `
window.fitAll = (root) => {
  const ctx = document.createElement('canvas').getContext('2d');
  root.querySelectorAll('text.fit').forEach((el) => {
    const txt = el.textContent;
    ctx.font = '900 100px "OWD"';
    const m = ctx.measureText(txt);
    const L = m.actualBoundingBoxLeft, R = m.actualBoundingBoxRight;
    const A = m.actualBoundingBoxAscent, D = m.actualBoundingBoxDescent;
    const s = Math.min(+el.dataset.w / (L + R), +el.dataset.h / (A + D));
    const cx = +el.dataset.cx, cy = +el.dataset.cy;
    el.setAttribute('font-size', (100 * s).toFixed(3));
    el.setAttribute('x', (cx - ((R - L) / 2) * s).toFixed(3));
    el.setAttribute('y', (cy + ((A - D) / 2) * s).toFixed(3));
  });
};`;

const pageHtml = (body, extraCss = '') => `<!doctype html><html><head><meta charset="utf-8">
<style>
@font-face { font-family: 'OWD'; src: url('file://${FONT}'); font-weight: 900; }
html, body { margin: 0; padding: 0; background: transparent; }
${extraCss}
</style><script>${FIT_JS}</script></head><body>${body}</body></html>`;

const svgWrap = (inner, size = 100) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${inner}</svg>`;

const browser = await chromium.launch();

// ---------- 1. PNG tĩnh ----------
const tmpHtml = path.join(ROOT, '.render.html');
fs.writeFileSync(tmpHtml, pageHtml('<div id="s" style="width:100px;height:100px"></div>'));
const page = await browser.newPage({ viewport: { width: 100, height: 100 }, deviceScaleFactor: 1 });
await page.goto('file://' + tmpHtml);
await page.evaluate(() => document.fonts.load('900 100px "OWD"', 'oWAGẮỦÒÀα0123456789:'));

async function shoot(svgInner, outFile) {
  await page.evaluate((html) => {
    const s = document.getElementById('s');
    s.innerHTML = html;
    window.fitAll(s);
  }, svgWrap(svgInner));
  await page.locator('#s').screenshot({ path: outFile, omitBackground: true });
}

const manifest = [];
for (const e of EMOJI) {
  const file = path.join(STATIC, `${e.id}.png`);
  await shoot(e.svg(e.id + '-'), file);
  const item = { id: e.id, group: e.group, name: e.name, use: e.use, emoji: e.emoji, keywords: e.keywords, static: `static/${e.id}.png` };
  manifest.push(item);
}
console.log(`PNG tĩnh: ${EMOJI.length}`);

// Lưu luôn mã SVG đã căn chữ (để sửa trên Figma/Illustrator nếu cần)
const SVG_DIR = path.join(DIST, 'svg');
fs.rmSync(SVG_DIR, { recursive: true, force: true });
fs.mkdirSync(SVG_DIR, { recursive: true });
for (const e of EMOJI) {
  const svg = await page.evaluate((html) => {
    const s = document.getElementById('s');
    s.innerHTML = html;
    window.fitAll(s);
    s.querySelectorAll('text.fit').forEach((t) => t.setAttribute('font-family', 'Inter Display, Inter, sans-serif'));
    return s.innerHTML;
  }, svgWrap(e.svg(e.id + '-')));
  fs.writeFileSync(path.join(SVG_DIR, `${e.id}.svg`), svg);
}

// ---------- 2. WEBM động ----------
const animated = EMOJI.filter((e) => e.anim);
for (const e of animated) {
  const dir = path.join(FRAMES, e.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const N = FPS * SECONDS;
  for (let i = 0; i < N; i++) {
    await shoot(e.anim(e.id + '-', i / N), path.join(dir, `f${String(i).padStart(3, '0')}.png`));
  }
  const out = path.join(VIDEO, `${e.id}.webm`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', path.join(dir, 'f%03d.png'),
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
    '-b:v', '0', '-crf', '30', '-deadline', 'good', '-row-mt', '1',
    '-an', '-t', String(SECONDS), out,
  ]);
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  manifest.find((m) => m.id === e.id).video = `video/${e.id}.webm`;
  console.log(`WEBM ${e.id}: ${kb} KB`);
}
fs.rmSync(FRAMES, { recursive: true, force: true });

fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify({ pack: 'oWAG', size: 100, items: manifest }, null, 2));

// ---------- 3. Ảnh xem trước ----------
const byId = Object.fromEntries(EMOJI.map((e) => [e.id, e]));
const icon = (id, size) => svgWrap(byId[id].svg(`pv${size}-${id}-`), size);

const groupsHtml = GROUPS.map((g) => {
  const items = EMOJI.filter((e) => e.group === g.id);
  return `<section><h2>${g.name}<span>${items.length}</span></h2><div class="grid">${items
    .map((e) => `<figure>${icon(e.id, 72)}<figcaption><b>${e.name}</b><i>${e.id}</i></figcaption></figure>`)
    .join('')}</div></section>`;
}).join('');

const inl = (id) => `<span class="ie">${icon(id, 22)}</span>`;
const post1 = `
<div class="bubble">
<div class="line big">${inl('owag_mark')} <b>BTC · KỊCH BẢN TUẦN</b></div>
<div class="line">${inl('long')} ${inl('lev_x5')} khung 4H, ví dụ minh hoạ</div>
<div class="line">${inl('entry')} 91.200 – 91.800</div>
<div class="line">${inl('tp1')} 94.500 &nbsp; ${inl('tp2')} 97.000 &nbsp; ${inl('tp3')} 99.800</div>
<div class="line">${inl('sl')} 89.400 &nbsp; ${inl('rr')} 1 : 2,6</div>
<div class="line">${inl('invalid')} Đóng nến 4H dưới 89.000: luận điểm bỏ.</div>
<div class="line">${inl('shield')} Rủi ro tối đa 1% vốn.</div>
</div>`;
const post2 = `
<div class="bubble light">
<div class="line big">${inl('pin')} <b>TỔNG KẾT TUẦN</b> ${inl('week')}</div>
<div class="line">${inl('n1')} ETH ${inl('short')} ${inl('hit_tp')} ${inl('win')} +2,1R</div>
<div class="line">${inl('n2')} SOL ${inl('long')} ${inl('hit_sl')} ${inl('loss')} −1R</div>
<div class="line">${inl('n3')} BNB ${inl('long')} ${inl('pending')} ${inl('cancel')}</div>
<div class="line">${inl('owag_seal')} Công khai đủ lệnh thắng lẫn thua.</div>
</div>`;

const previewHtml = pageHtml(
  `<main>
<header><div class="mark">${icon('owag_mark', 56)}</div><div><h1><em>o</em>WAG · Telegram custom emoji</h1>
<p>${EMOJI.length} emoji tĩnh · ${animated.length} emoji động · 100×100 px</p></div></header>
<section><h2>Dùng trong bài viết</h2><div class="posts">${post1}${post2}</div></section>
${groupsHtml}
</main>`,
  `
body { background: #07090C; font-family: 'Inter', sans-serif; color: ${C.white}; }
main { width: 1120px; padding: 40px 44px 48px; }
header { display: flex; gap: 18px; align-items: center; margin-bottom: 30px; }
h1 { font: 800 30px 'Inter Display', 'Inter'; margin: 0; letter-spacing: -0.5px; }
h1 em { color: ${C.gold}; font-style: normal; }
header p { margin: 6px 0 0; color: #8C95A1; font-size: 15px; }
h2 { font: 700 13px 'Inter'; text-transform: uppercase; letter-spacing: 1.6px; color: ${C.gold}; margin: 30px 0 14px; display: flex; gap: 10px; align-items: center; }
h2 span { color: #6B7480; font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
figure { margin: 0; background: #10141A; border: 1px solid #1C222B; border-radius: 14px; padding: 14px 6px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
figcaption { display: flex; flex-direction: column; align-items: center; gap: 2px; }
figcaption b { font-size: 12.5px; font-weight: 600; }
figcaption i { font-style: normal; font-size: 10.5px; color: #6B7480; font-family: 'DejaVu Sans Mono', monospace; }
.posts { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.bubble { background: #182533; border-radius: 16px; padding: 16px 18px; font-size: 16px; line-height: 1.75; }
.bubble.light { background: #FFFFFF; color: #0F1419; }
.line.big { font-size: 17px; margin-bottom: 4px; }
.ie { display: inline-block; width: 22px; height: 22px; vertical-align: -5px; }
.ie svg { display: block; }
`,
);
const pvFile = path.join(ROOT, '.preview.html');
fs.writeFileSync(pvFile, previewHtml);
const pv = await browser.newPage({ viewport: { width: 1120, height: 800 }, deviceScaleFactor: 2 });
await pv.goto('file://' + pvFile);
await pv.evaluate(() => document.fonts.load('900 100px "OWD"', 'oWAGẮỦÒÀα0123456789:'));
await pv.evaluate(() => window.fitAll(document.body));
await pv.locator('main').screenshot({ path: path.join(DIST, 'preview.png') });

await browser.close();
fs.rmSync(tmpHtml, { force: true });
fs.rmSync(pvFile, { force: true });
console.log('Xong. Xem dist/preview.png');
