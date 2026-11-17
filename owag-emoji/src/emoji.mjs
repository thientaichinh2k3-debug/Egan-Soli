// oWAG — bộ emoji tuỳ chỉnh cho Telegram.
// Mỗi emoji là một bản vẽ vector 100x100. Đổi màu thương hiệu ở bảng C bên dưới,
// chạy lại `node src/build.mjs` là toàn bộ bộ emoji được dựng lại.

export const C = {
  ink: '#0C0F14',
  ink1: '#1B2129',
  ink2: '#090B0F',
  edge: 'rgba(255,255,255,0.10)',
  gold: '#E2B562',
  goldHi: '#F8E1A8',
  goldLo: '#A2752B',
  goldInk: '#2A1D07',
  green: '#16C47F',
  greenHi: '#4FEAA6',
  greenLo: '#0A8551',
  red: '#F0455A',
  redHi: '#FF7D8C',
  redLo: '#A61E32',
  blue: '#4E9BFF',
  blueHi: '#A3CBFF',
  blueLo: '#2161C4',
  amber: '#FFB21E',
  amberHi: '#FFD36B',
  amberLo: '#D98407',
  grey: '#9AA3AF',
  greyLo: '#59616C',
  white: '#F4F1EA',
};

// ---------- công cụ vẽ ----------
const lg = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</linearGradient>`;

// Chữ tự co giãn để vừa khung (đo nét chữ thật, không đo hộp font).
const T = (content, { cx = 50, cy = 50, w, h, fill = C.white, extra = '' }) =>
  `<text class="fit" data-cx="${cx}" data-cy="${cy}" data-w="${w}" data-h="${h}" font-family="OWD" font-weight="900" fill="${fill}" ${extra}>${content}</text>`;

// Ô vuông nền mực — khung chung cho nhóm biểu tượng.
const tile = (p, inner, { top = C.ink1, bot = C.ink2, ring = null } = {}) => `
<defs>${lg(p + 'tile', [[0, top], [1, bot]])}</defs>
<rect x="4" y="4" width="92" height="92" rx="24" fill="url(#${p}tile)"/>
${ring
  ? `<rect x="5.5" y="5.5" width="89" height="89" rx="22.5" fill="none" stroke="${ring}" stroke-width="3"/>`
  : `<rect x="4.75" y="4.75" width="90.5" height="90.5" rx="23.25" fill="none" stroke="${C.edge}" stroke-width="1.5"/>`}
${inner}`;

// Đĩa tròn.
const disc = (p, hi, lo, inner, { edge = 'rgba(255,255,255,0.22)' } = {}) => `
<defs>${lg(p + 'disc', [[0, hi], [1, lo]])}</defs>
<circle cx="50" cy="50" r="45.5" fill="url(#${p}disc)"/>
<circle cx="50" cy="50" r="44.75" fill="none" stroke="${edge}" stroke-width="1.5"/>
${inner}`;

const PILL = { x: 2, y: 16, w: 96, h: 68, rx: 20 };

// Viên đặc — dùng cho chiều lệnh và đòn bẩy.
const pillFilled = (p, text, hi, lo, txt = C.white, extraTop = '') => `
<defs>
${lg(p + 'pf', [[0, hi], [1, lo]])}
${lg(p + 'gl', [[0, '#ffffff', 0.26], [0.55, '#ffffff', 0]])}
<clipPath id="${p}clip"><rect x="${PILL.x}" y="${PILL.y}" width="${PILL.w}" height="${PILL.h}" rx="${PILL.rx}"/></clipPath>
</defs>
<rect x="${PILL.x}" y="${PILL.y}" width="${PILL.w}" height="${PILL.h}" rx="${PILL.rx}" fill="url(#${p}pf)"/>
<rect x="${PILL.x}" y="${PILL.y}" width="${PILL.w}" height="${PILL.h / 2}" rx="${PILL.rx}" fill="url(#${p}gl)"/>
<rect x="2.75" y="16.75" width="94.5" height="66.5" rx="19.25" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
${T(text, { w: 86, h: 40, fill: txt })}
${extraTop}`;

// Viên viền — dùng cho mức giá.
const pillOutline = (p, text, color) => `
<defs>${lg(p + 'po', [[0, C.ink1], [1, C.ink2]])}</defs>
<rect x="3.5" y="17.5" width="93" height="65" rx="18.5" fill="url(#${p}po)" stroke="${color}" stroke-width="5"/>
${T(text, { w: 80, h: 36, fill: color })}`;

// Con dấu nghiêng — dùng cho trạng thái tổng kết tuần.
const stamp = (p, text, color, { strike = false } = {}) => `
<g transform="rotate(-5 50 50)">
<rect x="5.5" y="21" width="89" height="58" rx="10" fill="${C.ink}" stroke="${color}" stroke-width="4.5"/>
<rect x="11" y="26.5" width="78" height="47" rx="5.5" fill="none" stroke="${color}" stroke-width="1.6" opacity="0.7"/>
${T(text, { w: 72, h: 31, fill: color })}
${strike ? `<line x1="14" y1="51.5" x2="86" y2="48.5" stroke="${color}" stroke-width="4" stroke-linecap="round"/>` : ''}
</g>`;

const starburst = (cx, cy, rOut, rIn, n) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const bump = (t, at, width) => Math.max(0, 1 - Math.abs(t - at) / width);

// ---------- từng thành phần dùng chung giữa bản tĩnh và bản động ----------
const markBody = (p, angleDeg = -45, trail = false) => {
  const R = 37;
  const dot = (a, r, o) => {
    const rad = (a * Math.PI) / 180;
    return `<circle cx="${(50 + R * Math.cos(rad)).toFixed(2)}" cy="${(50 + R * Math.sin(rad)).toFixed(2)}" r="${r}" fill="${C.goldHi}" opacity="${o}"/>`;
  };
  let trailDots = '';
  if (trail) for (let k = 4; k >= 1; k--) trailDots += dot(angleDeg - k * 11, (5.6 * (1 - 0.14 * k)).toFixed(2), (0.55 - 0.12 * k).toFixed(2));
  return `
<defs>
${lg(p + 'bg', [[0, C.ink1], [1, C.ink2]])}
${lg(p + 'ring', [[0, C.goldHi], [0.5, C.gold], [1, C.goldLo]], 0, 0, 1, 1)}
</defs>
<circle cx="50" cy="50" r="45.5" fill="url(#${p}bg)"/>
<circle cx="50" cy="50" r="44.75" fill="none" stroke="${C.edge}" stroke-width="1.5"/>
<circle cx="50" cy="50" r="${R}" fill="none" stroke="${C.gold}" stroke-width="1.4" opacity="0.28"/>
<circle cx="50" cy="50" r="22" fill="none" stroke="url(#${p}ring)" stroke-width="13"/>
<path d="M35.5 38 A19 19 0 0 1 50 31" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="0.55"/>
${trailDots}
${dot(angleDeg, 5.6, 1)}`;
};

const eyeBody = (p, { dx = 0, lid = 1 } = {}) => tile(p, `
<defs>
${lg(p + 'iris', [[0, C.goldHi], [0.55, C.gold], [1, C.goldLo]], 0, 0, 1, 1)}
<clipPath id="${p}eclip"><path d="M13 50 Q50 14 87 50 Q50 86 13 50 Z"/></clipPath>
</defs>
<g transform="translate(50 50) scale(1 ${lid.toFixed(3)}) translate(-50 -50)">
<path d="M13 50 Q50 14 87 50 Q50 86 13 50 Z" fill="${C.white}"/>
<g clip-path="url(#${p}eclip)">
<circle cx="${50 + dx}" cy="50" r="17" fill="url(#${p}iris)"/>
<circle cx="${50 + dx}" cy="50" r="7.5" fill="${C.ink}"/>
<circle cx="${55 + dx}" cy="44.5" r="3" fill="#fff"/>
</g>
<path d="M13 50 Q50 14 87 50 Q50 86 13 50 Z" fill="none" stroke="${C.gold}" stroke-width="4" stroke-linejoin="round"/>
</g>`);

const checkPath = 'M29 51 L44 66 L72 36';
const CHECK_LEN = 62.3;

// ---------- danh mục ----------
// emoji: biểu tượng chuẩn Telegram bắt buộc gắn kèm (để tìm kiếm & gợi ý), không hiện trong bài.
export const GROUPS = [
  { id: 'brand', name: 'Thương hiệu' },
  { id: 'order', name: 'Lệnh & mức giá' },
  { id: 'status', name: 'Trạng thái lệnh' },
  { id: 'market', name: 'Thị trường & chủ đề' },
  { id: 'nav', name: 'Đánh số & mũi tên' },
];

export const EMOJI = [
  // ===== Thương hiệu =====
  {
    id: 'owag_mark', group: 'brand', name: 'Dấu oWAG', use: 'Mở đầu bài, chữ ký cuối bài',
    emoji: ['⭕'], keywords: ['owag', 'logo', 'egan'],
    svg: (p) => markBody(p),
    anim: (p, t) => markBody(p, -45 + 360 * t, true),
  },
  {
    id: 'owag_logo', group: 'brand', name: 'Huy hiệu oWAG', use: 'Đầu tiêu đề, ảnh đại diện mini',
    emoji: ['🪙'], keywords: ['owag', 'logo'],
    svg: (p) => `
<defs>${lg(p + 'bg', [[0, C.ink1], [1, C.ink2]])}${lg(p + 'rg', [[0, C.goldHi], [1, C.goldLo]], 0, 0, 1, 1)}</defs>
<circle cx="50" cy="50" r="45.5" fill="url(#${p}bg)"/>
<circle cx="50" cy="50" r="42" fill="none" stroke="url(#${p}rg)" stroke-width="3.5"/>
<circle cx="50" cy="50" r="36" fill="none" stroke="${C.gold}" stroke-width="1" opacity="0.35"/>
${T(`<tspan fill="${C.gold}">o</tspan>WAG`, { w: 60, h: 24, fill: C.white })}`,
  },
  {
    id: 'owag_word', group: 'brand', name: 'Chữ oWAG', use: 'Chèn tên thương hiệu trong câu',
    emoji: ['🔤'], keywords: ['owag', 'wordmark'],
    svg: (p) => `
<defs>${lg(p + 'bg', [[0, C.ink1], [1, C.ink2]])}</defs>
<rect x="3" y="18" width="94" height="64" rx="19" fill="url(#${p}bg)" stroke="${C.gold}" stroke-width="3.5"/>
${T(`<tspan fill="${C.gold}">o</tspan>WAG`, { w: 80, h: 34, fill: C.white })}`,
  },
  {
    id: 'owag_coin', group: 'brand', name: 'Đồng oWAG', use: 'Nói về token, phần thưởng cộng đồng',
    emoji: ['💰'], keywords: ['owag', 'coin', 'token'],
    svg: (p) => `
<defs>${lg(p + 'c', [[0, C.goldHi], [0.5, C.gold], [1, C.goldLo]], 0, 0, 1, 1)}${lg(p + 'c2', [[0, C.goldLo], [1, C.goldHi]], 0, 0, 1, 1)}</defs>
<circle cx="50" cy="50" r="45.5" fill="url(#${p}c)"/>
<circle cx="50" cy="50" r="37" fill="url(#${p}c2)" opacity="0.55"/>
<circle cx="50" cy="50" r="37" fill="none" stroke="${C.goldInk}" stroke-width="2" opacity="0.45"/>
<circle cx="50" cy="50" r="44.5" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.35"/>
${T('oW', { w: 46, h: 30, fill: C.goldInk })}`,
  },
  {
    id: 'owag_eye', group: 'brand', name: 'Mắt quan sát', use: 'Đang theo dõi, chờ xác nhận',
    emoji: ['👁️'], keywords: ['watch', 'theo dõi', 'quan sát'],
    svg: (p) => eyeBody(p),
    anim: (p, t) => {
      const dx = t < 0.6 ? 8 * Math.sin((2 * Math.PI * t) / 0.6) : 0;
      const lid = 1 - 0.93 * bump(t, 0.78, 0.06);
      return eyeBody(p, { dx: +dx.toFixed(2), lid });
    },
  },
  {
    id: 'owag_seal', group: 'brand', name: 'Dấu kiểm chứng', use: 'Số liệu đã kiểm chứng, lệnh công khai',
    emoji: ['✅'], keywords: ['verified', 'kiểm chứng', 'xác nhận'],
    svg: (p) => `
<defs>${lg(p + 's', [[0, C.goldHi], [0.5, C.gold], [1, C.goldLo]], 0, 0, 1, 1)}</defs>
<polygon points="${starburst(50, 50, 46, 39.5, 12)}" fill="url(#${p}s)" stroke="url(#${p}s)" stroke-width="2" stroke-linejoin="round"/>
<circle cx="50" cy="50" r="31" fill="none" stroke="${C.goldInk}" stroke-width="1.8" opacity="0.4"/>
<path d="M35 51 L46 62 L66 39" fill="none" stroke="${C.goldInk}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  // ===== Lệnh & mức giá =====
  {
    id: 'long', group: 'order', name: 'LONG', use: 'Chiều mua',
    emoji: ['🟢', '📈'], keywords: ['long', 'mua', 'buy'],
    svg: (p) => pillFilled(p, 'LONG', C.greenHi, C.greenLo),
    anim: (p, t) => pillFilled(p, 'LONG', C.greenHi, C.greenLo, C.white, shine(p, t)),
  },
  {
    id: 'short', group: 'order', name: 'SHORT', use: 'Chiều bán',
    emoji: ['🔴', '📉'], keywords: ['short', 'bán', 'sell'],
    svg: (p) => pillFilled(p, 'SHORT', C.redHi, C.redLo),
    anim: (p, t) => pillFilled(p, 'SHORT', C.redHi, C.redLo, C.white, shine(p, t)),
  },
  {
    id: 'entry', group: 'order', name: 'VÀO', use: 'Vùng vào lệnh',
    emoji: ['▶️'], keywords: ['entry', 'vào lệnh', 'điểm vào'],
    svg: (p) => pillOutline(p, 'VÀO', C.gold),
  },
  ...[1, 2, 3].map((n) => ({
    id: `tp${n}`, group: 'order', name: `TP${n}`, use: `Mục tiêu chốt lời ${n}`,
    emoji: ['🎯'], keywords: ['tp', `tp${n}`, 'chốt lời', 'take profit'],
    svg: (p) => pillOutline(p, `TP${n}`, C.green),
  })),
  {
    id: 'sl', group: 'order', name: 'SL', use: 'Điểm cắt lỗ',
    emoji: ['🛑'], keywords: ['sl', 'cắt lỗ', 'stop loss'],
    svg: (p) => pillOutline(p, 'SL', C.red),
  },
  {
    id: 'dca', group: 'order', name: 'DCA', use: 'Vùng trung bình giá',
    emoji: ['🔵'], keywords: ['dca', 'trung bình giá'],
    svg: (p) => pillOutline(p, 'DCA', C.blue),
  },
  {
    id: 'rr', group: 'order', name: 'R:R', use: 'Tỷ lệ lời/lỗ của kịch bản',
    emoji: ['⚖️'], keywords: ['rr', 'risk reward', 'tỷ lệ'],
    svg: (p) => pillOutline(p, 'R:R', C.grey),
  },
  ...['x3', 'x5', 'x10'].map((lv) => ({
    id: `lev_${lv}`, group: 'order', name: lv, use: `Đòn bẩy ${lv}`,
    emoji: ['⚡'], keywords: ['leverage', 'đòn bẩy', lv],
    svg: (p) => pillFilled(p, lv, C.goldHi, C.goldLo, C.goldInk),
  })),

  // ===== Trạng thái lệnh =====
  {
    id: 'win', group: 'status', name: 'THẮNG', use: 'Tổng kết: lệnh thắng',
    emoji: ['🏆'], keywords: ['win', 'thắng', 'lãi'],
    svg: (p) => stamp(p, 'THẮNG', C.green),
  },
  {
    id: 'loss', group: 'status', name: 'THUA', use: 'Tổng kết: lệnh thua',
    emoji: ['💀'], keywords: ['loss', 'thua', 'lỗ'],
    svg: (p) => stamp(p, 'THUA', C.red),
  },
  {
    id: 'breakeven', group: 'status', name: 'HÒA', use: 'Tổng kết: hoà vốn',
    emoji: ['➖'], keywords: ['breakeven', 'hòa vốn', 'be'],
    svg: (p) => stamp(p, 'HÒA', C.grey),
  },
  {
    id: 'cancel', group: 'status', name: 'HỦY', use: 'Kịch bản bị huỷ, không khớp',
    emoji: ['🚫'], keywords: ['cancel', 'hủy', 'huỷ'],
    svg: (p) => stamp(p, 'HỦY', C.grey, { strike: true }),
  },
  {
    id: 'hit_tp', group: 'status', name: 'Chạm TP', use: 'Đã chạm mục tiêu',
    emoji: ['✅'], keywords: ['hit tp', 'đạt mục tiêu', 'chạm tp'],
    svg: (p) => disc(p, C.greenHi, C.greenLo, `<path d="${checkPath}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`),
    anim: (p, t) => {
      const draw = ease((t - 0.1) / 0.3);
      const fade = draw < 0.02 ? 0 : 1 - ease((t - 0.86) / 0.12);
      const s = 1 + 0.07 * bump(t, 0.42, 0.08);
      return `<g transform="translate(50 50) scale(${s.toFixed(3)}) translate(-50 -50)">${disc(p, C.greenHi, C.greenLo,
        `<path d="${checkPath}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${CHECK_LEN}" stroke-dashoffset="${(CHECK_LEN * (1 - draw)).toFixed(2)}" opacity="${fade.toFixed(3)}"/>`)}</g>`;
    },
  },
  {
    id: 'hit_sl', group: 'status', name: 'Chạm SL', use: 'Đã dính cắt lỗ',
    emoji: ['❌'], keywords: ['hit sl', 'dính sl', 'cắt lỗ'],
    svg: (p) => disc(p, C.redHi, C.redLo, `<path d="M34 34 L66 66 M66 34 L34 66" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`),
  },
  {
    id: 'pending', group: 'status', name: 'Chờ khớp', use: 'Lệnh chờ, chưa khớp',
    emoji: ['⏳'], keywords: ['pending', 'chờ khớp', 'lệnh chờ'],
    svg: (p) => disc(p, C.amberHi, C.amberLo, `
<circle cx="50" cy="50" r="29" fill="none" stroke="${C.goldInk}" stroke-width="5" opacity="0.9"/>
<path d="M50 31 V50 L63 59" fill="none" stroke="${C.goldInk}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`),
  },
  {
    id: 'live', group: 'status', name: 'Đang chạy', use: 'Lệnh đang mở',
    emoji: ['🟢'], keywords: ['live', 'đang chạy', 'đang mở'],
    svg: (p) => liveBody(p, 0.35),
    anim: (p, t) => liveBody(p, t, true),
  },

  // ===== Thị trường & chủ đề =====
  {
    id: 'candles_up', group: 'market', name: 'Nến tăng', use: 'Xu hướng tăng',
    emoji: ['📈'], keywords: ['bull', 'tăng', 'uptrend'],
    svg: (p) => tile(p, candles(C.green, [[30, 56, 72, 50, 78], [50, 42, 62, 35, 68], [70, 24, 48, 18, 55]])),
  },
  {
    id: 'candles_down', group: 'market', name: 'Nến giảm', use: 'Xu hướng giảm',
    emoji: ['📉'], keywords: ['bear', 'giảm', 'downtrend'],
    svg: (p) => tile(p, candles(C.red, [[30, 24, 46, 18, 52], [50, 38, 58, 32, 65], [70, 52, 76, 45, 82]])),
  },
  {
    id: 'breakout', group: 'market', name: 'Phá kháng cự', use: 'Breakout',
    emoji: ['🚀'], keywords: ['breakout', 'phá kháng cự', 'vượt đỉnh'],
    svg: (p) => tile(p, `
<line x1="15" y1="50" x2="85" y2="50" stroke="${C.gold}" stroke-width="4" stroke-dasharray="7 5" stroke-linecap="round"/>
<polyline points="17,74 36,63 50,67 72,35.5" fill="none" stroke="${C.green}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<polygon points="81,22 80.2,42.5 63.6,31" fill="${C.green}" stroke="${C.green}" stroke-width="3" stroke-linejoin="round"/>`),
  },
  {
    id: 'breakdown', group: 'market', name: 'Thủng hỗ trợ', use: 'Breakdown',
    emoji: ['🕳️'], keywords: ['breakdown', 'thủng hỗ trợ', 'gãy nền'],
    svg: (p) => tile(p, `
<line x1="15" y1="50" x2="85" y2="50" stroke="${C.gold}" stroke-width="4" stroke-dasharray="7 5" stroke-linecap="round"/>
<polyline points="17,26 36,37 50,33 72,64.5" fill="none" stroke="${C.red}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<polygon points="81,78 80.2,57.5 63.6,69" fill="${C.red}" stroke="${C.red}" stroke-width="3" stroke-linejoin="round"/>`),
  },
  {
    id: 'alert', group: 'market', name: 'Cảnh báo', use: 'Rủi ro, tin xấu, cẩn trọng',
    emoji: ['⚠️'], keywords: ['alert', 'cảnh báo', 'rủi ro'],
    svg: (p) => alertBody(p, 1),
    anim: (p, t) => alertBody(p, 1 - 0.08 * (0.5 - 0.5 * Math.cos(4 * Math.PI * t))),
  },
  {
    id: 'flash', group: 'market', name: 'Tin nóng', use: 'Tin nhanh, biến động mạnh',
    emoji: ['⚡'], keywords: ['flash', 'tin nóng', 'breaking'],
    svg: (p) => flashBody(p, 0),
    anim: (p, t) => flashBody(p, Math.max(bump(t, 0.04, 0.04), bump(t, 0.16, 0.05))),
  },
  {
    id: 'liq', group: 'market', name: 'Thanh lý', use: 'Cháy tài khoản, thanh lý hàng loạt',
    emoji: ['💀'], keywords: ['liquidation', 'thanh lý', 'cháy'],
    svg: (p) => tile(p, `
<circle cx="50" cy="44" r="25" fill="${C.white}"/>
<rect x="35.5" y="54" width="29" height="21" rx="6" fill="${C.white}"/>
<ellipse cx="40" cy="46" rx="7.2" ry="8.2" fill="#160709"/>
<ellipse cx="60" cy="46" rx="7.2" ry="8.2" fill="#160709"/>
<circle cx="40" cy="47" r="2.4" fill="${C.red}"/>
<circle cx="60" cy="47" r="2.4" fill="${C.red}"/>
<path d="M50 55 L46 62 H54 Z" fill="#160709" stroke="#160709" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M44 66 V75 M50 66 V75 M56 66 V75" stroke="#160709" stroke-width="2.6"/>`, { top: '#3B111A', bot: '#140608' }),
  },
  {
    id: 'whale', group: 'market', name: 'Cá voi', use: 'Ví lớn, dòng tiền lớn',
    emoji: ['🐋'], keywords: ['whale', 'cá voi', 'dòng tiền'],
    svg: (p) => tile(p, `
<defs>${lg(p + 'wh', [[0, C.blueHi], [1, C.blueLo]])}</defs>
<path d="M12 58 C12 42 27 34 45 35 C60 36 69 45 73 50 L80 39 C82 35.5 88 35.5 91 38 C87 42 85.5 46 85.5 50.5 C89 52.5 91 56 89 58.5 C84.5 58.5 80 56.5 76.5 54.5 C72 65 60 73 44 73 C25 73 12 67 12 58 Z" fill="url(#${p}wh)"/>
<path d="M17 62 C26 67 42 68 56 63" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>
<circle cx="26" cy="51" r="3" fill="${C.ink}"/>
<path d="M34 32 C34 26 30 23 27 21 M34 32 C34 26 38 23 41 21 M34 32 V20" fill="none" stroke="${C.blueHi}" stroke-width="3.2" stroke-linecap="round"/>`),
  },
  {
    id: 'macro', group: 'market', name: 'Vĩ mô', use: 'Tin vĩ mô, lãi suất, dòng vốn toàn cầu',
    emoji: ['🌐'], keywords: ['macro', 'vĩ mô', 'fed'],
    svg: (p) => tile(p, `
<circle cx="50" cy="50" r="30" fill="none" stroke="${C.blueHi}" stroke-width="5"/>
<ellipse cx="50" cy="50" rx="13" ry="30" fill="none" stroke="${C.blueHi}" stroke-width="4"/>
<line x1="20" y1="50" x2="80" y2="50" stroke="${C.blueHi}" stroke-width="4"/>
<path d="M25 35 Q50 42 75 35 M25 65 Q50 58 75 65" fill="none" stroke="${C.blueHi}" stroke-width="3.5"/>`),
  },
  {
    id: 'research', group: 'market', name: 'Nghiên cứu', use: 'Bóc tách dự án, bài phân tích',
    emoji: ['🔍'], keywords: ['research', 'nghiên cứu', 'phân tích'],
    svg: (p) => tile(p, `
<line x1="58" y1="58" x2="77" y2="77" stroke="${C.gold}" stroke-width="11" stroke-linecap="round"/>
<circle cx="43" cy="43" r="22" fill="${C.ink}" stroke="${C.gold}" stroke-width="7"/>
<polyline points="31,51 38.5,44 44.5,48 55,35" fill="none" stroke="${C.green}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  },
  {
    id: 'target', group: 'market', name: 'Mục tiêu', use: 'Vùng giá mục tiêu',
    emoji: ['🎯'], keywords: ['target', 'mục tiêu'],
    svg: (p) => tile(p, `
<circle cx="50" cy="50" r="28" fill="none" stroke="${C.gold}" stroke-width="5"/>
<circle cx="50" cy="50" r="16.5" fill="none" stroke="${C.white}" stroke-width="5"/>
<circle cx="50" cy="50" r="6.5" fill="${C.gold}"/>
<path d="M50 13 V24 M50 76 V87 M13 50 H24 M76 50 H87" stroke="${C.white}" stroke-width="4.5" stroke-linecap="round"/>`),
  },
  {
    id: 'shield', group: 'market', name: 'Quản trị vốn', use: 'Quản trị rủi ro, bảo toàn vốn',
    emoji: ['🛡️'], keywords: ['risk', 'quản trị vốn', 'rủi ro'],
    svg: (p) => tile(p, `
<defs>${lg(p + 'sh', [[0, C.goldHi], [1, C.goldLo]], 0, 0, 1, 1)}</defs>
<path d="M50 15 L78 25.5 V48 C78 66 66 78.5 50 86 C34 78.5 22 66 22 48 V25.5 Z" fill="url(#${p}sh)" stroke="url(#${p}sh)" stroke-width="2" stroke-linejoin="round"/>
<path d="M37 50 L47 60 L64 40" fill="none" stroke="${C.goldInk}" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  },
  {
    id: 'hold', group: 'market', name: 'Nắm giữ', use: 'Vị thế dài hạn, khoá vốn',
    emoji: ['🔒'], keywords: ['hold', 'nắm giữ', 'dài hạn'],
    svg: (p) => tile(p, `
<defs>${lg(p + 'lk', [[0, C.goldHi], [1, C.goldLo]])}</defs>
<path d="M36 47 V36 C36 26.5 42 20 50 20 C58 20 64 26.5 64 36 V47" fill="none" stroke="#C9CED6" stroke-width="7.5"/>
<rect x="26" y="44" width="48" height="38" rx="9" fill="url(#${p}lk)"/>
<circle cx="50" cy="59" r="5.5" fill="${C.goldInk}"/>
<rect x="47.6" y="59" width="4.8" height="11" rx="2.4" fill="${C.goldInk}"/>`),
  },
  {
    id: 'pin', group: 'market', name: 'Ghim', use: 'Bài ghim, tổng kết tuần',
    emoji: ['📌'], keywords: ['pin', 'ghim'],
    svg: (p) => tile(p, `
<defs>${lg(p + 'pn', [[0, C.redHi], [1, C.redLo]], 0, 0, 1, 0)}</defs>
<g transform="rotate(35 50 52)">
<path d="M48.6 58 H51.4 L50 90 Z" fill="#C9CED6"/>
<rect x="36" y="14" width="28" height="10" rx="4" fill="url(#${p}pn)"/>
<path d="M41.5 24 H58.5 L61.5 50 H38.5 Z" fill="url(#${p}pn)"/>
<rect x="29" y="48" width="42" height="10" rx="5" fill="url(#${p}pn)"/>
<rect x="44" y="27" width="4" height="20" rx="2" fill="#fff" opacity="0.35"/>
</g>`),
  },
  {
    id: 'week', group: 'market', name: 'Tổng kết tuần', use: 'Bản tổng kết 7 ngày',
    emoji: ['🗓️'], keywords: ['weekly', 'tuần', 'tổng kết'],
    svg: (p) => tile(p, `
<rect x="19" y="25" width="62" height="56" rx="9" fill="${C.white}"/>
<path d="M19 34 A9 9 0 0 1 28 25 H72 A9 9 0 0 1 81 34 V42 H19 Z" fill="${C.gold}"/>
<rect x="31" y="18" width="7" height="15" rx="3.5" fill="#C9CED6"/>
<rect x="62" y="18" width="7" height="15" rx="3.5" fill="#C9CED6"/>
${T('7', { cy: 61.5, w: 30, h: 26, fill: C.ink })}`),
  },
  {
    id: 'bell', group: 'market', name: 'Thông báo', use: 'Báo động giá, nhắc lịch',
    emoji: ['🔔'], keywords: ['alert', 'thông báo', 'nhắc'],
    svg: (p) => tile(p, `
<defs>${lg(p + 'bl', [[0, C.goldHi], [1, C.goldLo]], 0, 0, 1, 1)}</defs>
<circle cx="50" cy="72" r="7.5" fill="${C.gold}"/>
<circle cx="50" cy="18.5" r="4.5" fill="${C.gold}"/>
<path d="M50 21 C37.5 21 30 30.5 30 43 V55 L22.5 65 H77.5 L70 55 V43 C70 30.5 62.5 21 50 21 Z" fill="url(#${p}bl)" stroke="url(#${p}bl)" stroke-width="2" stroke-linejoin="round"/>
<path d="M38 36 C40 31 44 28.5 48 28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`),
  },
  {
    id: 'gem', group: 'market', name: 'Đá quý', use: 'Đồng tiền tiềm năng',
    emoji: ['💎'], keywords: ['gem', 'tiềm năng', 'kèo thơm'],
    svg: (p) => tile(p, `
<polygon points="28,38 39,24 45,38" fill="#9BEBFF"/>
<polygon points="39,24 61,24 55,38 45,38" fill="#D4F8FF"/>
<polygon points="61,24 72,38 55,38" fill="#6FD8F5"/>
<polygon points="28,38 45,38 50,80" fill="#3FC1EC"/>
<polygon points="45,38 55,38 50,80" fill="#86E2F9"/>
<polygon points="55,38 72,38 50,80" fill="#1E8DCB"/>
<polygon points="28,38 39,24 61,24 72,38 50,80" fill="none" stroke="#E9FCFF" stroke-width="1.6" stroke-linejoin="round" opacity="0.8"/>`),
  },
  {
    id: 'alpha', group: 'market', name: 'Alpha', use: 'Góc nhìn riêng, thông tin sớm',
    emoji: ['🔮'], keywords: ['alpha', 'kèo riêng', 'insight'],
    svg: (p) => tile(p, T('α', { cy: 51, w: 52, h: 42, fill: C.gold })),
  },
  {
    id: 'invalid', group: 'market', name: 'Phủ định', use: 'Điều kiện phủ định luận điểm',
    emoji: ['⛔'], keywords: ['invalidation', 'phủ định', 'sai luận điểm'],
    svg: (p) => disc(p, C.ink1, C.ink2, `
<circle cx="50" cy="50" r="29" fill="none" stroke="${C.amber}" stroke-width="9"/>
<line x1="29.5" y1="29.5" x2="70.5" y2="70.5" stroke="${C.amber}" stroke-width="9" stroke-linecap="round"/>`, { edge: C.edge }),
  },

  // ===== Đánh số & mũi tên =====
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    id: `n${n}`, group: 'nav', name: `Số ${n}`, use: 'Đánh số ý trong bài',
    emoji: [`${n}️⃣`], keywords: [`${n}`, 'số', 'number'],
    svg: (p) => tile(p, T(String(n), { w: 44, h: 46, fill: C.gold }), { ring: C.gold }),
  })),
  {
    id: 'arrow_up', group: 'nav', name: 'Mũi tên lên', use: 'Tăng, vượt',
    emoji: ['⬆️'], keywords: ['up', 'tăng', 'lên'],
    svg: (p) => `<defs>${lg(p + 'a', [[0, C.greenHi], [1, C.greenLo]])}</defs>
<path d="M50 12 L86 50 H65 V87 H35 V50 H14 Z" fill="url(#${p}a)" stroke="url(#${p}a)" stroke-width="6" stroke-linejoin="round"/>`,
  },
  {
    id: 'arrow_down', group: 'nav', name: 'Mũi tên xuống', use: 'Giảm, thủng',
    emoji: ['⬇️'], keywords: ['down', 'giảm', 'xuống'],
    svg: (p) => `<defs>${lg(p + 'a', [[0, C.redHi], [1, C.redLo]])}</defs>
<path d="M50 88 L86 50 H65 V13 H35 V50 H14 Z" fill="url(#${p}a)" stroke="url(#${p}a)" stroke-width="6" stroke-linejoin="round"/>`,
  },
  {
    id: 'arrow_right', group: 'nav', name: 'Mũi tên phải', use: 'Gạch đầu dòng, dẫn ý',
    emoji: ['➡️'], keywords: ['right', 'tiếp', 'dẫn ý'],
    svg: (p) => `<defs>${lg(p + 'a', [[0, C.goldHi], [1, C.goldLo]])}</defs>
<path d="M88 50 L50 14 V35 H13 V65 H50 V86 Z" fill="url(#${p}a)" stroke="url(#${p}a)" stroke-width="6" stroke-linejoin="round"/>`,
  },
];

// ---------- các khối vẽ phụ (khai báo sau vì dùng hoisting của function) ----------
function shine(p, t) {
  const k = ease(t / 0.55);
  const x = -70 + 220 * k;
  return `<defs>${lg(p + 'sn', [[0, '#ffffff', 0], [0.5, '#ffffff', 0.5], [1, '#ffffff', 0]], 0, 0, 1, 0)}</defs>
<g clip-path="url(#${p}clip)"><rect x="${x.toFixed(2)}" y="0" width="30" height="100" fill="url(#${p}sn)" transform="skewX(-18)"/></g>`;
}

function liveBody(p, t, animated = false) {
  const ring = (ph) => {
    const r = 15 + 27 * ph;
    const o = 0.75 * (1 - ph);
    return `<circle cx="50" cy="50" r="${r.toFixed(2)}" fill="none" stroke="${C.green}" stroke-width="4.5" opacity="${o.toFixed(3)}"/>`;
  };
  const rings = animated
    ? ring(t) + ring((t + 0.5) % 1)
    : `<circle cx="50" cy="50" r="25" fill="none" stroke="${C.green}" stroke-width="4.5" opacity="0.55"/><circle cx="50" cy="50" r="36" fill="none" stroke="${C.green}" stroke-width="4.5" opacity="0.25"/>`;
  return disc(p, C.ink1, C.ink2, `
${rings}
<defs>${lg(p + 'ld', [[0, C.greenHi], [1, C.greenLo]])}</defs>
<circle cx="50" cy="50" r="14" fill="url(#${p}ld)"/>
<circle cx="45.5" cy="45.5" r="3.6" fill="#fff" opacity="0.6"/>`, { edge: C.edge });
}

function alertBody(p, s) {
  return `<defs>${lg(p + 'al', [[0, C.amberHi], [1, C.amberLo]])}</defs>
<g transform="translate(50 54) scale(${s.toFixed(4)}) translate(-50 -54)">
<path d="M50 14 L90.5 85 H9.5 Z" fill="url(#${p}al)" stroke="url(#${p}al)" stroke-width="11" stroke-linejoin="round"/>
<rect x="44.5" y="36" width="11" height="29" rx="5.5" fill="${C.goldInk}"/>
<circle cx="50" cy="75" r="6" fill="${C.goldInk}"/>
</g>`;
}

function flashBody(p, k) {
  // k = 0..1 cường độ loé sáng
  const mix = (a, b) => {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
    const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
  };
  const hi = mix(C.goldHi, '#FFFFFF');
  const lo = mix(C.goldLo, '#FFE9A8');
  return tile(p, `
<defs>${lg(p + 'fl', [[0, hi], [1, lo]], 0, 0, 1, 1)}
<radialGradient id="${p}glow"><stop offset="0" stop-color="${C.goldHi}" stop-opacity="${(0.55 * k).toFixed(3)}"/><stop offset="1" stop-color="${C.goldHi}" stop-opacity="0"/></radialGradient></defs>
<circle cx="50" cy="50" r="42" fill="url(#${p}glow)"/>
<path d="M58 12 L25 57 H47 L40 88 L75 41 H53 Z" fill="url(#${p}fl)" stroke="url(#${p}fl)" stroke-width="3.5" stroke-linejoin="round"/>`);
}

function candles(color, list) {
  // [cx, bodyTop, bodyBottom, wickTop, wickBottom]
  return list
    .map(
      ([x, bt, bb, wt, wb], i) => `
<line x1="${x}" y1="${wt}" x2="${x}" y2="${wb}" stroke="${color}" stroke-width="3.5" stroke-linecap="round" opacity="${0.7 + i * 0.15}"/>
<rect x="${x - 7}" y="${bt}" width="14" height="${bb - bt}" rx="3" fill="${color}" opacity="${0.7 + i * 0.15}"/>`,
    )
    .join('');
}
