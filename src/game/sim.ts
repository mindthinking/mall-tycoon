import {
  MALLS,
  SEGMENTS,
  categoryById,
  floorOpenCost,
  mallById,
  mallComplete,
  marketingById,
  nextUnbuiltMall,
  productById,
  productUnlocked,
  type CategoryId,
  type MallId,
  type MallState,
  type SegId,
  type Tier,
} from "./catalog";
import { money } from "./format";

export type SimInput = {
  day: number;
  activeMall: MallId;
  marketing: Record<MallId, string>;
  malls: Record<MallId, MallState>;
};

export type FloorResult = {
  index: number;
  category: CategoryId | null;
  name: string;
  visitors: number;
  conversion: number;
  revenue: number;
  cost: number;
  profit: number;
  note: string;
  open: boolean;
};

export type MallResult = {
  mallId: MallId;
  name: string;
  visitors: number;
  revenue: number;
  cost: number;
  profit: number;
  stars: number;
  satisfaction: number;
  marketingId: string;
  marketingName: string;
  marketingCost: number;
  floors: FloorResult[];
  notes: string[];
  segments: { id: SegId; name: string; visitors: number }[];
};

export type DayResult = {
  day: number;
  eventName: string;
  eventDetail: string;
  visitors: number;
  revenue: number;
  cost: number;
  profit: number;
  stars: number;
  satisfaction: number;
  malls: MallResult[];
};

const TIER_MUL: Record<Tier, number> = { mass: 0.78, mid: 1, premium: 1.46 };
const MARGIN: Record<Tier, number> = { mass: 0.4, mid: 0.48, premium: 0.56 };
const STOCK: Record<Tier, number> = { mass: 240, mid: 460, premium: 860 };

const EVENTS: {
  name: string;
  detail: string;
  traffic: number;
  ticket: number;
  conv: number;
  seg: Partial<Record<SegId, number>>;
}[] = [
  { name: "平常日", detail: "人潮穩定，照常做生意。", traffic: 1, ticket: 1, conv: 1, seg: {} },
  {
    name: "晴朗週末",
    detail: "家庭客多出門逛。",
    traffic: 1.12,
    ticket: 1,
    conv: 1,
    seg: { family: 1.45, student: 1.15 },
  },
  {
    name: "發薪日",
    detail: "上班族口袋比較鬆。",
    traffic: 1.05,
    ticket: 1.1,
    conv: 1.03,
    seg: { office: 1.4 },
  },
  {
    name: "社群熱潮",
    detail: "打卡話題把潮人帶出門。",
    traffic: 1.08,
    ticket: 1.04,
    conv: 1,
    seg: { trend: 1.55 },
  },
  { name: "午後陣雨", detail: "臨時起意的人少了一些。", traffic: 0.84, ticket: 1, conv: 0.98, seg: {} },
  {
    name: "城市夜遊",
    detail: "貴客願意進店看看。",
    traffic: 0.96,
    ticket: 1.08,
    conv: 1,
    seg: { vip: 1.75 },
  },
  {
    name: "商圈活動",
    detail: "整條街都在逛。",
    traffic: 1.16,
    ticket: 0.98,
    conv: 1.02,
    seg: { student: 1.2, family: 1.12 },
  },
];

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function eventFor(day: number) {
  return EVENTS[((day % EVENTS.length) + EVENTS.length) % EVENTS.length] ?? EVENTS[0];
}

function tierFactor(tier: Tier, seg: SegId): number {
  if (tier === "mass") {
    if (seg === "student" || seg === "family") return 1.16;
    if (seg === "vip") return 0.42;
    if (seg === "trend") return 0.72;
    return 0.96;
  }
  if (tier === "mid") {
    if (seg === "office") return 1.12;
    if (seg === "vip") return 0.82;
    return 1;
  }
  if (seg === "vip") return 1.38;
  if (seg === "trend") return 1.22;
  if (seg === "student") return 0.55;
  if (seg === "family") return 0.7;
  return 0.92;
}

function luxFeel(seg: SegId, luxury: number): number {
  if (seg === "vip" || seg === "trend") return 0.7 + 0.08 * luxury;
  if (seg === "student") return 1.1 - 0.06 * (luxury - 1);
  return 0.92 + 0.04 * luxury;
}

function appeal(cat: CategoryId, products: { tier: Tier }[], luxury: number, seg: SegId): number {
  const base = categoryById(cat).appeal[seg];
  if (products.length === 0) return base * 0.25;
  const tf = products.reduce((sum, p) => sum + tierFactor(p.tier, seg), 0) / products.length;
  return clamp(base * tf * luxFeel(seg, luxury), 0.02, 1.35);
}

function weightsFor(
  tier: number,
  mktSeg: Partial<Record<SegId, number>>,
  eventSeg: Partial<Record<SegId, number>>,
  audience: SegId[],
): Record<SegId, number> {
  const w = {} as Record<SegId, number>;
  for (const seg of SEGMENTS) {
    let value = 1;
    if (seg.id === "student") value = 1.05;
    if (seg.id === "office") value = 1.05;
    if (seg.id === "trend") value = 0.85;
    if (seg.id === "family") value = 0.95;
    if (seg.id === "vip") value = 0.28 * (1 + (tier - 1) * 0.4);
    if (audience.includes(seg.id)) value *= 2.6;
    else value *= 0.38;
    if (tier >= 4 && seg.id === "student") value *= 0.7;
    if (tier >= 8 && seg.id === "vip") value *= 1.4;
    if (tier >= 9 && seg.id === "student") value *= 0.55;
    value *= mktSeg[seg.id] ?? 1;
    value *= eventSeg[seg.id] ?? 1;
    w[seg.id] = value;
  }
  return w;
}

function desireFor(cat: CategoryId, products: { tier: Tier }[], luxury: number, audience: SegId[]): number {
  if (audience.length === 0) return 0;
  const total = audience.reduce((sum, seg) => sum + appeal(cat, products, luxury, seg), 0);
  return total / audience.length;
}

function crowdFit(weights: Record<SegId, number>, audience: SegId[]): number {
  const sum = SEGMENTS.reduce((total, seg) => total + weights[seg.id], 0) || 1;
  const hit = audience.reduce((total, id) => total + (weights[id] ?? 0), 0);
  return hit / sum;
}

function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map((v) => Math.floor(v));
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (left > 0 && order.length > 0) {
    const slot = order[k % order.length];
    if (!slot) break;
    out[slot.i] = (out[slot.i] ?? 0) + 1;
    left -= 1;
    k += 1;
  }
  return out;
}

function liveProducts(ids: string[], cat: CategoryId, luxury: number, mallTier: number) {
  return ids
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => !!p && p.cat === cat && productUnlocked(p, luxury, mallTier));
}

function simulateMall(
  input: SimInput,
  mallId: MallId,
  event: (typeof EVENTS)[number],
  wave: number,
): MallResult {
  const def = mallById(mallId);
  const mall = input.malls[mallId];
  const rawMkt = marketingById(input.marketing[mallId] ?? "none");
  const mkt = rawMkt.minTier > def.tier ? marketingById("none") : rawMkt;
  const weights = weightsFor(def.tier, mkt.seg, event.seg, def.audience);
  const fit = crowdFit(weights, def.audience);
  const catCount: Partial<Record<CategoryId, number>> = {};
  for (const floor of mall.floors) {
    if (floor.built && floor.category && floor.products.length > 0) {
      catCount[floor.category] = (catCount[floor.category] ?? 0) + 1;
    }
  }
  const hasFood = mall.floors.some((f) => f.built && f.category === "food" && f.products.length > 0);
  const share = mall.floors.map((floor) => {
    if (!floor.built || !floor.category) return 0;
    const products = liveProducts(floor.products, floor.category, floor.luxury, def.tier);
    if (products.length === 0) return 0.3;
    let score = desireFor(floor.category, products, floor.luxury, def.audience);
    const dup = catCount[floor.category] ?? 1;
    return score / (1 + 0.9 * (dup - 1));
  });
  const openCount = mall.floors.filter((f) => f.built && f.category && f.products.length > 0).length;
  const traffic = Math.max(
    0,
    Math.round(def.baseTraffic * 0.82 * (1 + 0.1 * Math.max(0, openCount - 1)) * mkt.traffic * event.traffic * wave),
  );
  const visits = allocate(traffic, share);
  const segVisits = allocate(
    traffic,
    SEGMENTS.map((seg) => weights[seg.id]),
  );
  const segments = SEGMENTS.map((seg, index) => ({
    id: seg.id,
    name: seg.name,
    visitors: segVisits[index] ?? 0,
  }));
  const floors: FloorResult[] = [];
  let convSum = 0;
  let convN = 0;

  mall.floors.forEach((floor, index) => {
    if (!floor.built) return;
    const visitors = visits[index] ?? 0;
    if (!floor.category) {
      floors.push({
        index,
        category: null,
        name: "未規劃",
        visitors: 0,
        conversion: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        note: "這層還沒決定賣什麼，今天不營業。",
        open: false,
      });
      return;
    }
    const cat = floor.category;
    const cdef = categoryById(cat);
    const products = liveProducts(floor.products, cat, floor.luxury, def.tier);
    const wage = def.wage;
    if (products.length === 0) {
      floors.push({
        index,
        category: cat,
        name: cdef.name,
        visitors,
        conversion: 0,
        revenue: 0,
        cost: wage,
        profit: -wage,
        note: "貨架是空的，客人只能逛不能買。",
        open: true,
      });
      return;
    }
    const desire = desireFor(cat, products, floor.luxury, def.audience);
    const pull = clamp((desire - 0.4) / 0.68, 0, 1);
    const intent = pull * pull * (0.15 + 0.85 * fit);
    let conv = 0.012 + intent * 0.82;
    if (products.length >= 3 && desire >= 0.6) conv += 0.03;
    if (products.length === 1) conv -= 0.03;
    if (hasFood && cat !== "food" && desire >= 0.55) conv += 0.02;
    if (desire >= 0.58) conv += mkt.conv;
    else conv += mkt.conv * 0.2;
    conv = clamp(conv * event.conv, 0.012, 0.58);
    const tierMul = products.reduce((sum, p) => sum + TIER_MUL[p.tier], 0) / products.length;
    const ticket =
      cdef.ticket * tierMul * (1 + (floor.luxury - 1) * 0.07) * def.ticketMult * event.ticket;
    const margin = clamp(
      products.reduce((sum, p) => sum + MARGIN[p.tier], 0) / products.length + mkt.margin,
      0.08,
      0.75,
    );
    const rev = Math.round(visitors * conv * ticket);
    const cogs = Math.round(rev * (1 - margin));
    const stock = products.reduce((sum, p) => sum + STOCK[p.tier], 0);
    const floorCost = cogs + stock + wage;
    const profit = rev - floorCost;
    convSum += conv;
    convN += 1;
    const dup = catCount[cat] ?? 1;
    let note = "生意平穩。";
    if (dup > 1) note = "同類樓層在搶同一批客人。";
    else if (cat === "food" && desire >= 0.6) note = "美食把人留住，其他樓層也受惠。";
    else if (conv >= 0.4) note = "這層轉換不錯。";
    else if (conv < 0.12) note = "這層今天不太賣得動。";
    else if (products.every((p) => p.tier === "mass") && floor.luxury >= 3) note = "裝潢漂亮，貨卻偏平價。";
    floors.push({
      index,
      category: cat,
      name: cdef.name,
      visitors,
      conversion: conv,
      revenue: rev,
      cost: floorCost,
      profit,
      note,
      open: true,
    });
  });

  const marketingCost = Math.round(mkt.cost * def.costMult);
  const revenue = floors.reduce((sum, floor) => sum + floor.revenue, 0);
  const cost = floors.reduce((sum, floor) => sum + floor.cost, 0) + marketingCost;
  const profit = revenue - cost;
  const avgConv = convN ? convSum / convN : 0;
  let sat = 56 + Math.min(24, avgConv * 36);
  if (mkt.id !== "none") sat += 4;
  if (hasFood && openCount > 1) sat += 4;
  sat -= floors.filter((floor) => floor.open && floor.revenue === 0).length * 8;
  if (profit < 0) sat -= 8;
  sat -= Object.values(catCount).filter((n) => (n ?? 0) > 1).length * 4;
  sat = clamp(sat, 8, 99);
  const stars = sat >= 90 ? 5 : sat >= 76 ? 4 : sat >= 60 ? 3 : sat >= 45 ? 2 : 1;
  const notes: string[] = [];
  if (Object.values(catCount).some((n) => (n ?? 0) > 1)) notes.push("相同品類分樓層，人潮會被拆開。");
  return {
    mallId,
    name: def.name,
    visitors: floors.reduce((sum, floor) => sum + floor.visitors, 0),
    revenue,
    cost,
    profit,
    stars,
    satisfaction: Math.round(sat),
    marketingId: mkt.id,
    marketingName: mkt.name,
    marketingCost,
    floors,
    notes,
    segments,
  };
}

export function simulate(input: SimInput): DayResult {
  const event = eventFor(input.day);
  const wave = 0.94 + hash01(input.day) * 0.12;
  const malls = MALLS.filter((def) => input.malls[def.id]?.built).map((def) =>
    simulateMall(input, def.id, event, wave),
  );
  const visitors = malls.reduce((sum, mall) => sum + mall.visitors, 0);
  const revenue = malls.reduce((sum, mall) => sum + mall.revenue, 0);
  const cost = malls.reduce((sum, mall) => sum + mall.cost, 0);
  const profit = revenue - cost;
  const stars = visitors
    ? Math.round(malls.reduce((sum, mall) => sum + mall.stars * Math.max(1, mall.visitors), 0) / Math.max(1, visitors))
    : (malls[0]?.stars ?? 3);
  const satisfaction = visitors
    ? Math.round(malls.reduce((sum, mall) => sum + mall.satisfaction * Math.max(1, mall.visitors), 0) / Math.max(1, visitors))
    : (malls[0]?.satisfaction ?? 60);
  return {
    day: input.day,
    eventName: event.name,
    eventDetail: event.detail,
    visitors,
    revenue,
    cost,
    profit,
    stars: clamp(stars, 1, 5),
    satisfaction,
    malls,
  };
}

export function warnings(input: SimInput): string[] {
  const out: string[] = [];
  for (const def of MALLS) {
    const mall = input.malls[def.id];
    if (!mall?.built) continue;
    mall.floors.forEach((floor, index) => {
      if (!floor.built) return;
      const where = input.malls.lane?.built && MALLS.filter((m) => input.malls[m.id]?.built).length > 1
        ? `${def.name} ${index + 1}F`
        : `${index + 1}F`;
      if (!floor.category) out.push(`${where} 還沒決定賣什麼`);
      else if (floor.products.length === 0) out.push(`${where} 沒有容許任何貨品`);
    });
  }
  return out;
}

export function coachLine(input: SimInput, cash: number): string {
  const warn = warnings(input);
  if (warn[0]) return `${warn[0]}。先處理再來開舖。`;
  const def = mallById(input.activeMall);
  const mall = input.malls[input.activeMall];
  const mkt = input.marketing[input.activeMall] ?? "none";
  if (mkt === "none" && input.day <= 2) return "先出一個行銷方案。預估淨利會跟著變，再決定開不開舖。";
  const nextFloor = mall.floors.findIndex((floor) => !floor.built);
  if (nextFloor >= 0 && cash >= floorOpenCost(def, nextFloor)) {
    return "現金夠再蓋一層。樓層愈多，人潮愈容易起來。";
  }
  if (mallComplete(mall, def)) {
    const nxt = nextUnbuiltMall(input.malls);
    if (!nxt) return "十座商場都起滿了。這座城最潮的店，是你的。";
    const prev = MALLS[MALLS.findIndex((m) => m.id === nxt.id) - 1];
    if (prev?.id === input.activeMall) {
      if (cash >= nxt.buildCost) return `${def.name}起滿了。可以蓋更高、更豪華的${nxt.name}。`;
      return `${def.name}起滿了。再賺 ${money(nxt.buildCost - cash)} 就能蓋${nxt.name}。`;
    }
  }
  const event = eventFor(input.day);
  if (event.name === "午後陣雨") return "今天下雨，人會少一點，還是可以開舖。";
  return "每天開舖，客人會自己走進來。起滿這一座，就能蓋下一座。";
}
