import { SHELL, categoryById, type CategoryId, type SegId } from "./catalog";

export const COLS = 8;
export const ROWS = 5;
const TW = 62;
const TH = 34;
const FLOOR_GAP = 128;
const BASE_Z = 36;
const SLAB = 36;
const WALL = 52;

export type Camera = { x: number; y: number; zoom: number };

export type DrawFloor = {
  category: CategoryId | null;
  luxury: number;
  products: number;
};

export type DrawModel = {
  sign: string;
  tier: number;
  maxFloors: number;
  floors: DrawFloor[];
  guests: { seg: SegId; share: number }[];
};

export type Walker = {
  c: number;
  r: number;
  tc: number;
  tr: number;
  floor: number;
  speed: number;
  hair: string;
  shirt: string;
  pants: string;
  phase: number;
  bag: string | null;
  wait: number;
  plaza: boolean;
  seg: SegId;
  quote: string | null;
};

export type Floater = {
  c: number;
  r: number;
  floor: number;
  text: string;
  life: number;
  max: number;
  rise: number;
  big: boolean;
};

const HAIR = ["#2a211c", "#4a3428", "#1c1c1c", "#6b4428", "#3a2a24"];
const BAGS = ["#e36b3a", "#f2d48a", "#fff6ec", "#1f6f78", "#d4538c"];
const SPOTS: [number, number][] = [
  [1.4, 0.8],
  [3.2, 0.9],
  [5.1, 0.8],
  [2.2, 2.2],
  [4.4, 2.3],
  [1.6, 3.6],
  [3.5, 3.7],
  [5.2, 3.5],
];

export function iso(c: number, r: number, z: number): { x: number; y: number } {
  return { x: (c - r) * (TW / 2), y: (c + r) * (TH / 2) - z };
}

export function fitCamera(viewW: number, viewH: number, floors: number, focus = 0): Camera {
  const n = Math.max(1, floors);
  const i = Math.max(0, Math.min(n - 1, focus));
  const z = BASE_Z + i * FLOOR_GAP;
  const pts = [
    iso(-0.15, ROWS + 0.35, z - 4),
    iso(COLS + 0.2, -0.05, z + WALL + 14),
    iso(COLS + 0.35, ROWS + 0.45, z - 4),
    iso(-0.35, -0.05, z + WALL + 14),
  ];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const zoom = Math.max(
    0.55,
    Math.min(3.4, Math.min((viewW - 36) / Math.max(1, maxX - minX), (viewH - 20) / Math.max(1, maxY - minY)) * 0.98),
  );
  return { x: -((minX + maxX) / 2), y: -((minY + maxY) / 2), zoom };
}

function pointInPoly(x: number, y: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i];
    const pj = poly[j];
    if (!pi || !pj) continue;
    const intersect = pi.y > y !== pj.y > y && x < ((pj.x - pi.x) * (y - pi.y)) / (pj.y - pi.y + 0.00001) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function hitFloor(px: number, py: number, cam: Camera, w: number, h: number, floors: number): number | null {
  const wx = (px - w / 2) / cam.zoom - cam.x;
  const wy = (py - h / 2) / cam.zoom - cam.y;
  for (let i = floors - 1; i >= 0; i--) {
    const z = BASE_Z + i * FLOOR_GAP;
    const poly = [iso(0, 0, z), iso(COLS, 0, z), iso(COLS, ROWS, z), iso(0, ROWS, z)];
    if (pointInPoly(wx, wy, poly)) return i;
  }
  return null;
}

export function project(wx: number, wy: number, cam: Camera, w: number, h: number, sx = 0, sy = 0) {
  return { x: (wx + cam.x) * cam.zoom + w / 2 + sx, y: (wy + cam.y) * cam.zoom + h / 2 + sy };
}

const LINES: Record<SegId, string[]> = {
  student: ["看看折扣", "學生來逛", "順便看看"],
  office: ["午休順路", "外套不錯", "下班來逛"],
  trend: ["這款要拍", "限定在哪", "好想打卡"],
  family: ["帶小孩來", "先吃東西", "全家一起"],
  vip: ["有會員嗎", "新品到了", "包起來"],
};

const SEG_SHIRT: Record<SegId, string[]> = {
  student: ["#3d64c4", "#6f8fe0", "#243868"],
  office: ["#2c3142", "#4e5968", "#fff6ec"],
  trend: ["#d4538c", "#2c241c", "#f0d78c"],
  family: ["#e08a2e", "#5a9a52", "#fff6ec"],
  vip: ["#2c241c", "#c4a15a", "#6b4428"],
};

function pickSeg(index: number, mix: { seg: SegId; share: number }[]): SegId {
  const usable = mix.filter((item) => item.share > 0);
  if (usable.length === 0) return "office";
  const total = usable.reduce((sum, item) => sum + item.share, 0);
  let roll = ((index * 0.61803398875) % 1) * total;
  for (const item of usable) {
    roll -= item.share;
    if (roll <= 0) return item.seg;
  }
  return usable[usable.length - 1]?.seg ?? "office";
}

export function createWalkers(floors: number, lively: boolean, mix: { seg: SegId; share: number }[] = []): Walker[] {
  const n = lively ? Math.min(46, 12 + floors * 6) : Math.min(18, 6 + floors * 3);
  const list: Walker[] = [];
  for (let i = 0; i < n; i++) {
    const plaza = !lively && i < 4;
    const spot = SPOTS[i % SPOTS.length] ?? [2, 2];
    const seg = pickSeg(i, mix);
    const shirts = SEG_SHIRT[seg];
    const quote = i % 5 === 0 ? (LINES[seg][i % LINES[seg].length] ?? null) : null;
    list.push({
      c: plaza ? Math.random() * COLS : spot[0],
      r: plaza ? ROWS + 1.05 : spot[1],
      tc: plaza ? Math.random() * COLS : spot[0],
      tr: plaza ? ROWS + 1.15 : spot[1],
      floor: plaza ? 0 : Math.floor(Math.random() * Math.max(1, floors)),
      speed: 0.65 + Math.random() * 0.85,
      hair: HAIR[i % HAIR.length] ?? "#2a211c",
      shirt: shirts[i % shirts.length] ?? "#e36b3a",
      pants: i % 2 === 0 ? "#2c3142" : "#4e5968",
      phase: Math.random() * 6,
      bag: lively && Math.random() < 0.62 ? (BAGS[i % BAGS.length] ?? "#e36b3a") : seg === "vip" ? "#c4a15a" : null,
      wait: Math.random() * 0.4,
      plaza,
      seg,
      quote,
    });
  }
  return list;
}

export function stepWalkers(list: Walker[], dt: number, floors: number): void {
  const cap = Math.min(dt, 0.05);
  for (const w of list) {
    w.phase += cap;
    if (w.wait > 0) {
      w.wait -= cap;
      continue;
    }
    const dc = w.tc - w.c;
    const dr = w.tr - w.r;
    const dist = Math.hypot(dc, dr);
    if (dist < 0.08) {
      w.wait = 0.35 + Math.random() * 1.3;
      if (w.plaza) {
        w.tc = -0.2 + Math.random() * (COLS + 0.6);
        w.tr = ROWS + 0.85 + Math.random() * 0.7;
      } else {
        const spot = SPOTS[Math.floor(Math.random() * SPOTS.length)] ?? [2, 2];
        w.tc = spot[0];
        w.tr = spot[1];
        if (floors > 1 && Math.random() < 0.2) w.floor = Math.floor(Math.random() * floors);
      }
    } else {
      const step = Math.min(dist, w.speed * cap);
      w.c += (dc / dist) * step;
      w.r += (dr / dist) * step;
    }
  }
}

type Palette = { floorA: string; floorB: string; aisle: string; accent: string; ink: string };

function palette(cat: CategoryId | null): Palette {
  if (!cat) return SHELL;
  const c = categoryById(cat);
  return { floorA: c.floorA, floorB: c.floorB, aisle: c.aisle, accent: c.accent, ink: c.ink };
}

function path(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  const first = pts[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p) ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
}

function quad(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
  fill: string,
) {
  path(ctx, [a, b, c, d]);
  ctx.fillStyle = fill;
  ctx.fill();
}

function tile(ctx: CanvasRenderingContext2D, c: number, r: number, z: number, fill: string) {
  path(ctx, [iso(c, r, z), iso(c + 1, r, z), iso(c + 1, r + 1, z), iso(c, r + 1, z)]);
  ctx.fillStyle = fill;
  ctx.fill();
}

function lip(
  ctx: CanvasRenderingContext2D,
  c0: number,
  r0: number,
  c1: number,
  r1: number,
  z: number,
  depth: number,
  fill: string,
) {
  quad(ctx, iso(c0, r0, z), iso(c1, r1, z), iso(c1, r1, z - depth), iso(c0, r0, z - depth), fill);
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, tier: number) {
  const skies: [string, string, string][] = [
    ["#c5e6f6", "#e7f4ea", "#f6e7d2"],
    ["#b7ddf6", "#d9f1ea", "#f8e6cc"],
    ["#f6c7a4", "#f8dec4", "#d5e7f4"],
    ["#f0b184", "#f6d3ae", "#f0d0c4"],
    ["#e89262", "#f3c49a", "#f8e2c4"],
    ["#d7c4a4", "#f4d7b4", "#f7e6cf"],
    ["#c9b7c4", "#f0d0b8", "#f6e2c8"],
    ["#8ea4c4", "#e7c4ae", "#f3d7b8"],
    ["#5d6f92", "#d7a888", "#efd0aa"],
    ["#3d4e74", "#c98b6a", "#e8c09a"],
  ];
  const sky = skies[Math.min(skies.length - 1, Math.max(0, tier - 1))] ?? skies[0];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.55, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawPlaza(ctx: CanvasRenderingContext2D, time: number) {
  for (let r = -1; r < ROWS + 3; r++) {
    for (let c = -2; c < COLS + 2; c++) {
      const road = r >= ROWS + 0.2 && r < ROWS + 2.15;
      const grass = !road && (r < 0 || c < 0 || c >= COLS);
      const fill = road ? (Math.floor(c + r) % 2 === 0 ? "#5c6670" : "#556069") : grass ? "#d7e7c8" : "#f4efe6";
      tile(ctx, c, r, 0, fill);
    }
  }
  ctx.strokeStyle = "#f4f7f2";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  const a = iso(-1.5, ROWS + 1.15, 1);
  const b = iso(COLS + 1.2, ROWS + 1.15, 1);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 5; i++) {
    const c0 = 1.1 + i * 0.28;
    quad(ctx, iso(c0, ROWS + 0.25, 1), iso(c0 + 0.16, ROWS + 0.25, 1), iso(c0 + 0.16, ROWS + 2.05, 1), iso(c0, ROWS + 2.05, 1), "#f7f4ee");
  }
  tree(ctx, -0.9, 1.2);
  tree(ctx, -1.1, 3.4);
  tree(ctx, COLS + 0.35, 1.1);
  tree(ctx, COLS + 0.15, ROWS + 0.2);
  const booth = iso(COLS - 0.2, ROWS + 0.55, 0);
  ctx.fillStyle = "#1f6f78";
  ctx.fillRect(booth.x - 7, booth.y - 16, 14, 12);
  ctx.fillStyle = "#fff6ec";
  ctx.font = '700 8px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("P", booth.x, booth.y - 6);
  car(ctx, -1.2 + ((time * 1.15) % (COLS + 3)), ROWS + 0.7, "#f2c84b", true);
  car(ctx, COLS + 1 - ((time * 0.85) % (COLS + 3)), ROWS + 1.55, "#f7f4ee", false);
}

function tree(ctx: CanvasRenderingContext2D, c: number, r: number) {
  const p = iso(c, r, 0);
  ctx.fillStyle = "#6b4a32";
  ctx.fillRect(p.x - 1.5, p.y - 8, 3, 8);
  ctx.fillStyle = "#3f8f55";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2f6d40";
  ctx.beginPath();
  ctx.arc(p.x + 3, p.y - 10, 5, 0, Math.PI * 2);
  ctx.fill();
}

function car(ctx: CanvasRenderingContext2D, c: number, r: number, color: string, taxi: boolean) {
  const p = iso(c, r, 0);
  ctx.fillStyle = "rgba(44,36,28,0.18)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 4, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  round(ctx, p.x - 11, p.y - 6, 22, 8, 2);
  ctx.fill();
  ctx.fillStyle = taxi ? "#f7f4ee" : "#d5e7f2";
  round(ctx, p.x - 6, p.y - 11, 12, 6, 2);
  ctx.fill();
  if (taxi) {
    ctx.fillStyle = "#2c241c";
    ctx.fillRect(p.x - 1, p.y - 14, 2, 3);
  }
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function furn(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  w: number,
  d: number,
  h: number,
  z: number,
  top: string,
  face: string,
  side: string,
) {
  const z1 = z + h;
  quad(ctx, iso(c, r, z1), iso(c + w, r, z1), iso(c + w, r + d, z1), iso(c, r + d, z1), top);
  quad(ctx, iso(c, r + d, z1), iso(c + w, r + d, z1), iso(c + w, r + d, z), iso(c, r + d, z), face);
  quad(ctx, iso(c + w, r, z1), iso(c + w, r + d, z1), iso(c + w, r + d, z), iso(c + w, r, z), side);
}

function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = 3.4) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8ee";
  ctx.beginPath();
  ctx.arc(x - 0.4, y - 0.4, radius * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

function plant(ctx: CanvasRenderingContext2D, c: number, r: number, z: number) {
  const p = iso(c, r, z + 2);
  ctx.fillStyle = "#6b4a32";
  ctx.fillRect(p.x - 1.2, p.y - 4, 2.4, 6);
  bloom(ctx, p.x, p.y - 8, "#3f8f55", 5);
  bloom(ctx, p.x + 3.2, p.y - 6, "#2f6d40", 3.6);
}

function wallSign(ctx: CanvasRenderingContext2D, text: string, c: number, z: number, bg: string) {
  const p = iso(c, 0.05, z + WALL - 10);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(p.x - 18, p.y - 9, 36, 16, 5);
  ctx.fill();
  ctx.strokeStyle = "#2c241c";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "#fffdf8";
  ctx.font = '700 9px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, p.x, p.y);
  ctx.textBaseline = "alphabetic";
}

function mirror(ctx: CanvasRenderingContext2D, c: number, r: number, z: number) {
  const p = iso(c, r, z + 18);
  ctx.fillStyle = "#f4b7cc";
  ctx.beginPath();
  ctx.roundRect(p.x - 7, p.y - 18, 14, 20, 7);
  ctx.fill();
  ctx.fillStyle = "#d9f6fb";
  ctx.beginPath();
  ctx.roundRect(p.x - 5, p.y - 16, 10, 14, 5);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(p.x - 3, p.y - 13, 2, 5);
}

function chair(ctx: CanvasRenderingContext2D, c: number, r: number, z: number, color: string) {
  furn(ctx, c, r, 0.38, 0.38, 7, z, color, "#f7d5e2", "#e7b8cc");
  const p = iso(c + 0.19, r + 0.1, z + 14);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(p.x - 5, p.y - 8, 10, 8, 3);
  ctx.fill();
}

function bookStack(ctx: CanvasRenderingContext2D, c: number, r: number, z: number) {
  const colors = ["#e36b3a", "#3d64c4", "#3f8f55", "#f2d48a"];
  colors.forEach((color, i) => {
    furn(ctx, c, r + i * 0.02, 0.42, 0.28, 3 + i * 2.2, z, color, "#fffdf8", "#ead9c8");
  });
}

function clothing(ctx: CanvasRenderingContext2D, c: number, r: number, z: number, pal: Palette) {
  const p = iso(c, r, z + 2);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x - 10, p.y);
  ctx.lineTo(p.x + 10, p.y - 5);
  ctx.stroke();
  const dyes = [pal.accent, "#fffdf8", "#2c241c", pal.ink];
  dyes.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(p.x - 9 + i * 4.4, p.y - 12 - (i % 2), 3.2, 10, 1.2);
    ctx.fill();
  });
}

function counter(ctx: CanvasRenderingContext2D, c: number, r: number, z: number, top: string) {
  furn(ctx, c, r, 1.25, 0.55, 12, z, top, "#f3e2cc", "#d7c2a4");
}

function drawProps(ctx: CanvasRenderingContext2D, cat: CategoryId | null, luxury: number, z: number, pal: Palette) {
  if (!cat) {
    for (let i = 0; i < 3; i++) {
      furn(ctx, 1.2 + i * 1.8, 1.6, 0.9, 0.7, 4, z, "#e7edf3", "#d5dee8", "#c5d0dc");
    }
    return;
  }
  quad(ctx, iso(1.7, 1.35, z + 1), iso(5.5, 1.35, z + 1), iso(5.5, 3.7, z + 1), iso(1.7, 3.7, z + 1), pal.aisle);
  furn(ctx, 0.35, 0.18, 6.3, 0.42, 16, z, "#f7f1e6", pal.accent, "#e7d7c4");
  for (let i = 0; i < 7; i++) {
    const p = iso(0.7 + i * 0.85, 0.32, z + 20);
    ctx.fillStyle = i % 2 ? pal.accent : "#fffdf8";
    ctx.fillRect(p.x - 6, p.y - 6, 12, 7);
  }
  if (luxury >= 2) {
    plant(ctx, 0.45, 2.1, z);
    plant(ctx, 6.35, 2.15, z);
  }

  if (cat === "flower") {
    wallSign(ctx, "花禮", 3.2, z, "#3f8f55");
    const tables: [number, number][] = [
      [1.3, 1.7],
      [3.5, 1.65],
      [1.45, 3.15],
      [3.7, 3.1],
    ];
    const dyes = ["#e36b3a", "#f2d48a", "#d4538c", "#fffdf8", "#7ec8e3"];
    tables.forEach(([c, r], index) => {
      furn(ctx, c, r, 1.15, 0.7, 10, z, "#f4e7c8", "#e7d3b0", "#d7c09a");
      dyes.forEach((color, i) => {
        const p = iso(c + 0.22 + (i % 3) * 0.32, r + 0.18 + Math.floor(i / 3) * 0.28, z + 14);
        bloom(ctx, p.x, p.y - 4, color, 3.6);
      });
      if (index === 0) {
        const p = iso(c + 0.5, r + 0.3, z + 16);
        bloom(ctx, p.x, p.y - 8, "#e36b3a", 5);
      }
    });
    counter(ctx, 5.15, 3.35, z, "#fffdf8");
    if (luxury >= 3) {
      const arch = iso(4.7, 1.55, z + 28);
      ctx.strokeStyle = "#f7c9d8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(arch.x, arch.y, 12, Math.PI, 0);
      ctx.stroke();
      bloom(ctx, arch.x - 10, arch.y, "#e36b3a", 3.2);
      bloom(ctx, arch.x, arch.y - 12, "#f2d48a", 3.2);
      bloom(ctx, arch.x + 10, arch.y, "#d4538c", 3.2);
    }
  } else if (cat === "salon") {
    wallSign(ctx, "美髮", 3.2, z, "#e56b9a");
    const spots: [number, number][] = [
      [1.15, 1.55],
      [2.7, 1.55],
      [4.25, 1.55],
      [1.25, 3.05],
      [2.85, 3.05],
      [4.4, 3.05],
    ];
    spots.forEach(([c, r]) => {
      furn(ctx, c, r, 0.85, 0.48, 8, z, "#fffdf8", "#f7d5e4", "#f0c4d6");
      mirror(ctx, c + 0.42, r + 0.05, z);
      chair(ctx, c + 0.22, r + 0.62, z, "#f48bb4");
    });
    counter(ctx, 5.2, 3.25, z, "#f7b7d0");
    if (luxury >= 3) {
      furn(ctx, 5.35, 1.7, 0.7, 0.9, 8, z, "#d9f6fb", "#f7d5e4", "#c9e8f0");
    }
  } else if (cat === "book") {
    wallSign(ctx, "書店", 3.2, z, "#c47a3a");
    bookStack(ctx, 1.4, 1.8, z);
    bookStack(ctx, 2.5, 1.75, z);
    bookStack(ctx, 1.55, 3.15, z);
    bookStack(ctx, 3.3, 3.1, z);
    furn(ctx, 3.6, 1.7, 1.3, 0.75, 10, z, "#fffdf8", "#f3e2cc", "#e7d3b0");
    counter(ctx, 5.15, 3.3, z, "#f6ead4");
  } else if (cat === "fashion" || cat === "sport") {
    wallSign(ctx, cat === "fashion" ? "服飾" : "運動", 3.2, z, pal.accent);
    clothing(ctx, 1.3, 1.7, z, pal);
    clothing(ctx, 3.2, 1.65, z, pal);
    clothing(ctx, 1.5, 3.2, z, pal);
    clothing(ctx, 3.6, 3.15, z, pal);
    counter(ctx, 5.15, 3.3, z, "#fffdf8");
    const doll = iso(5.5, 1.8, z);
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.roundRect(doll.x - 5, doll.y - 22, 10, 14, 3);
    ctx.fill();
    ctx.fillStyle = "#f0c2a0";
    ctx.beginPath();
    ctx.arc(doll.x, doll.y - 28, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (cat === "beauty") {
    wallSign(ctx, "美妝", 3.2, z, pal.accent);
    for (let i = 0; i < 3; i++) {
      furn(ctx, 1.2 + i * 1.35, 1.7, 0.95, 0.5, 9, z, "#fff7fb", "#f7d0e4", "#f0c4d8");
      mirror(ctx, 1.65 + i * 1.35, 1.7, z);
    }
    furn(ctx, 1.4, 3.15, 2.4, 0.6, 8, z, "#fffdf8", "#f8d5e6", "#f0c4d8");
    counter(ctx, 5.15, 3.25, z, "#f8d5e6");
  } else if (cat === "gadget") {
    wallSign(ctx, "潮玩", 3.2, z, pal.accent);
    for (let i = 0; i < 3; i++) {
      furn(ctx, 1.2 + i * 1.4, 1.65, 1.05, 0.7, 10, z, "#12343a", "#1f8f98", "#145e66");
      const screen = iso(1.7 + i * 1.4, 1.9, z + 16);
      ctx.fillStyle = i % 2 ? "#7ef0f2" : "#f2d48a";
      ctx.fillRect(screen.x - 6, screen.y - 8, 12, 8);
    }
    counter(ctx, 5.15, 3.3, z, "#d2f3f4");
  } else if (cat === "food") {
    wallSign(ctx, "美食", 3.2, z, "#e08a2e");
    furn(ctx, 0.5, 0.7, 5.6, 0.55, 14, z, "#fff6ec", "#e36b3a", "#c46a32");
    for (let i = 0; i < 4; i++) {
      furn(ctx, 1.1 + i * 1.15, 2.15, 0.7, 0.7, 8, z, "#fffdf8", "#f7d0a8", "#e7c090");
      furn(ctx, 1.25 + i * 1.15, 3.15, 0.42, 0.42, 6, z, "#e08a2e", "#c46a32", "#a85828");
    }
  } else if (cat === "jewel" || cat === "luxury") {
    wallSign(ctx, cat === "jewel" ? "珠寶" : "精品", 3.2, z, "#232838");
    for (let i = 0; i < 3; i++) {
      furn(ctx, 1.15 + i * 1.45, 1.6, 1.1, 0.7, 11, z, "#f7f4ee", "#e7e4f2", "#d4b15a");
      const gem = iso(1.7 + i * 1.45, 1.9, z + 16);
      ctx.fillStyle = i === 1 ? "#e36b3a" : "#f2d48a";
      ctx.beginPath();
      ctx.moveTo(gem.x, gem.y - 6);
      ctx.lineTo(gem.x + 4, gem.y);
      ctx.lineTo(gem.x, gem.y + 5);
      ctx.lineTo(gem.x - 4, gem.y);
      ctx.fill();
    }
    counter(ctx, 5.1, 3.25, z, "#fffdf8");
  } else {
    wallSign(ctx, "家居", 3.2, z, pal.accent);
    furn(ctx, 1.2, 1.7, 1.8, 0.8, 9, z, "#dceccf", "#cfe3bf", "#b7d4a4");
    furn(ctx, 3.4, 1.75, 1.1, 1.1, 8, z, "#f7f1e6", "#e7d7c4", "#d7c4ae");
    furn(ctx, 1.4, 3.15, 1.5, 0.7, 8, z, "#fffdf8", "#dceccf", "#c5deb4");
    const lamp = iso(5.4, 1.9, z + 24);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lamp.x, lamp.y);
    ctx.lineTo(lamp.x, lamp.y + 12);
    ctx.stroke();
    ctx.fillStyle = "#f2d48a";
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (luxury >= 4) {
    const p = iso(3.4, 2.4, z + 34);
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y + 12);
    ctx.stroke();
    ctx.fillStyle = "#f2d48a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEscalator(ctx: CanvasRenderingContext2D, z: number, time: number) {
  for (let i = 0; i < 6; i++) {
    const r = 0.7 + i * 0.62;
    const bob = (time * 0.8 + i * 0.15) % 1;
    const zz = z + 3 + bob * 3;
    quad(ctx, iso(COLS - 1, r, zz), iso(COLS - 0.05, r, zz), iso(COLS - 0.05, r + 0.5, zz), iso(COLS - 1, r + 0.5, zz), i % 2 ? "#d5dde4" : "#f4f7fa");
  }
  ctx.strokeStyle = "#2c241c";
  ctx.lineWidth = 1.6;
  const top = iso(COLS - 1.02, 0.55, z + WALL - 8);
  const bot = iso(COLS - 1.02, ROWS - 0.35, z + 10);
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(bot.x, bot.y);
  ctx.stroke();
}

function drawPerson(ctx: CanvasRenderingContext2D, w: Walker, z: number, time: number) {
  const bob = Math.sin(time * 7 + w.phase * 2) * 1.4;
  const p = iso(w.c, w.r, z);
  const y = p.y + bob;
  ctx.save();
  ctx.translate(p.x, y);
  ctx.scale(1.55, 1.55);
  ctx.translate(-p.x, -y);
  ctx.fillStyle = "rgba(44,36,28,0.16)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 7, 5, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = w.pants;
  round(ctx, p.x - 3.1, y - 1, 6.2, 6, 1.5);
  ctx.fill();
  ctx.fillStyle = w.shirt;
  round(ctx, p.x - 4.2, y - 9, 8.4, 8, 3);
  ctx.fill();
  ctx.fillStyle = "#f0c2a0";
  ctx.beginPath();
  ctx.arc(p.x, y - 13.5, 3.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = w.hair;
  ctx.beginPath();
  ctx.arc(p.x, y - 14.6, 3.4, Math.PI, 0);
  ctx.fill();
  if (w.seg === "student") {
    ctx.fillStyle = "#243868";
    round(ctx, p.x - 7.2, y - 8, 3.2, 4.6, 1);
    ctx.fill();
  } else if (w.seg === "office") {
    ctx.fillStyle = "#fff6ec";
    ctx.fillRect(p.x - 0.7, y - 8, 1.4, 4);
  } else if (w.seg === "vip") {
    ctx.fillStyle = "#c4a15a";
    ctx.fillRect(p.x + 1.2, y - 7.2, 2.2, 1.4);
  } else if (w.seg === "family") {
    ctx.fillStyle = "#f0c2a0";
    ctx.beginPath();
    ctx.arc(p.x + 7, y - 6, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e08a2e";
    round(ctx, p.x + 5, y - 4, 4.2, 4, 1.4);
    ctx.fill();
  }
  if (w.bag) {
    ctx.fillStyle = w.bag;
    round(ctx, p.x + 4, y - 8, 3.4, 4.4, 1);
    ctx.fill();
  }
  ctx.restore();
}

function drawTalk(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = '700 12px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif';
  const width = Math.ceil(ctx.measureText(text).width + 14);
  const height = 22;
  const left = x - width / 2;
  const top = y - height - 8;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 8);
  ctx.fillStyle = "#fffdf8";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#ead9c8";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, top + height - 0.5);
  ctx.lineTo(x, top + height + 6);
  ctx.lineTo(x + 4, top + height - 0.5);
  ctx.fillStyle = "#fffdf8";
  ctx.fill();
  ctx.fillStyle = "#2c241c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, top + height / 2);
  ctx.textBaseline = "alphabetic";
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  opts: {
    w: number;
    h: number;
    cam: Camera;
    model: DrawModel;
    selected: number;
    walkers: Walker[];
    floaters: Floater[];
    time: number;
    shakeX: number;
    shakeY: number;
  },
) {
  const { w, h, cam, model, walkers, floaters, time, shakeX, shakeY } = opts;
  const floors = model.floors;
  const n = Math.max(1, floors.length);
  const growing = floors.length < model.maxFloors;
  drawSky(ctx, w, h, model.tier);
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.translate(w / 2, h / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(cam.x, cam.y);
  drawPlaza(ctx, time);

  for (let i = 0; i < n; i++) {
    const floor = floors[i];
    if (!floor) continue;
    const z = BASE_Z + i * FLOOR_GAP;
    const pal = palette(floor.category);
    quad(ctx, iso(0, 0, z + WALL), iso(COLS, 0, z + WALL), iso(COLS, 0, z), iso(0, 0, z), "#f7fbff");
    quad(ctx, iso(0, 0, z + WALL), iso(0, ROWS, z + WALL), iso(0, ROWS, z), iso(0, 0, z), "#e7eef5");
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const esc = c >= COLS - 1 && r > 0 && r < ROWS - 1;
        const aisle = r >= 2 && r <= 2 && c < COLS - 1;
        let fill = (c + r) % 2 === 0 ? pal.floorA : pal.floorB;
        if (aisle) fill = floor.luxury >= 5 ? "#f4e4c0" : pal.aisle;
        if (esc) fill = "#c5ced6";
        if (!floor.category && (c + r) % 3 === 0) fill = "#e7edf3";
        tile(ctx, c, r, z, fill);
        ctx.strokeStyle = "rgba(44,36,28,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    const depth = i === 0 ? BASE_Z : SLAB;
    lip(ctx, 0, ROWS, COLS, ROWS, z, depth, i === opts.selected ? "#e6a21e" : "#c9b7a4");
    lip(ctx, COLS, 0, COLS, ROWS, z, depth, i === opts.selected ? "#c98a16" : "#b7a492");
    if (i === opts.selected) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 186, 48, 0.55)";
      ctx.lineWidth = 7 / cam.zoom;
      path(ctx, [iso(0, 0, z), iso(COLS, 0, z), iso(COLS, ROWS, z), iso(0, ROWS, z)]);
      ctx.stroke();
      ctx.strokeStyle = "#ffe08a";
      ctx.lineWidth = 2.4 / cam.zoom;
      ctx.stroke();
      ctx.restore();
    }
    drawProps(ctx, floor.category, floor.luxury, z, pal);
    if (i < n - 1 || growing) drawEscalator(ctx, z, time);
    if (i === 0) {
      quad(
        ctx,
        iso(1.8, ROWS - 0.05, z + WALL + 6),
        iso(4.5, ROWS - 0.05, z + WALL + 6),
        iso(4.7, ROWS + 0.45, z + WALL + 6),
        iso(1.6, ROWS + 0.45, z + WALL + 6),
        "#e36b3a",
      );
      quad(ctx, iso(2.3, ROWS, z + WALL - 4), iso(3.9, ROWS, z + WALL - 4), iso(3.9, ROWS, z), iso(2.3, ROWS, z), "rgba(186,220,232,0.95)");
    }
    const people = walkers
      .filter((w) => !w.plaza && w.floor === i)
      .sort((a, b) => a.c + a.r - (b.c + b.r));
    for (const person of people) drawPerson(ctx, person, z, time);
    const tag = iso(-0.35, ROWS * 0.62, z + WALL * 0.45);
    ctx.fillStyle = "#2c241c";
    ctx.font = '700 13px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(`${i + 1}F`, tag.x, tag.y);
  }

  const roofZ = BASE_Z + (n - 1) * FLOOR_GAP + WALL + 10;
  const signC = COLS / 2;
  const sw = Math.min(4.2, 1.1 + model.sign.length * 0.7);
  quad(
    ctx,
    iso(signC - sw / 2, -0.15, roofZ),
    iso(signC + sw / 2, -0.15, roofZ),
    iso(signC + sw / 2, 0.85, roofZ),
    iso(signC - sw / 2, 0.85, roofZ),
    "#fffdf8",
  );
  lip(ctx, signC - sw / 2, 0.85, signC + sw / 2, 0.85, roofZ, 8, "#e36b3a");
  const label = iso(signC, 0.35, roofZ + 2);
  ctx.fillStyle = "#2c241c";
  ctx.font = '700 15px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(model.sign, label.x, label.y);
  ctx.textBaseline = "alphabetic";

  if (growing) {
    const mastA = iso(COLS - 1.3, 0.3, roofZ);
    const mastB = iso(COLS - 0.5, -0.2, roofZ + 46);
    ctx.strokeStyle = "#c47a3a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mastA.x, mastA.y);
    ctx.lineTo(mastB.x, mastB.y);
    ctx.lineTo(mastB.x - 18, mastB.y + 4);
    ctx.stroke();
  }

  const plazaPeople = walkers.filter((w) => w.plaza).sort((a, b) => a.c + a.r - (b.c + b.r));
  for (const person of plazaPeople) drawPerson(ctx, person, 0, time);

  ctx.restore();

  const talking = walkers.filter((person) => person.quote);
  const floorTalk = talking.filter((person) => person.floor === opts.selected || opts.selected < 0);
  const chosen = (floorTalk.length > 0 ? floorTalk : talking).slice(0, 3);
  for (const person of chosen) {
    if (!person.quote) continue;
    const z = person.plaza ? 18 : BASE_Z + person.floor * FLOOR_GAP + 28;
    const anchor = iso(person.c, person.r, z);
    const screen = project(anchor.x, anchor.y, cam, w, h, shakeX, shakeY);
    if (screen.x < 36 || screen.x > w - 36 || screen.y < 28 || screen.y > h - 78) continue;
    drawTalk(ctx, screen.x, screen.y - 8, person.quote);
  }

  ctx.textAlign = "center";
  for (const floater of floaters) {
    const z = floater.floor < 0 ? 20 : BASE_Z + floater.floor * FLOOR_GAP + 20;
    const anchor = iso(floater.c, floater.r, z);
    const screen = project(anchor.x, anchor.y - floater.rise, cam, w, h, shakeX, shakeY);
    const alpha = Math.max(0, floater.life / floater.max);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = floater.big ? "#c4472a" : "#e6a21e";
    ctx.font = floater.big
      ? '800 22px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif'
      : '700 13px "Noto Sans TC", "WenQuanYi Zen Hei", sans-serif';
    ctx.fillText(floater.text, screen.x, screen.y);
    ctx.globalAlpha = 1;
  }
}
