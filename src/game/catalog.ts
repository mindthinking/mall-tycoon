export const SEGMENTS = [
  { id: "student", name: "學生" },
  { id: "office", name: "上班族" },
  { id: "trend", name: "潮人" },
  { id: "family", name: "家庭" },
  { id: "vip", name: "貴客" },
] as const;

export type SegId = (typeof SEGMENTS)[number]["id"];

export type Tier = "mass" | "mid" | "premium";

export type CategoryId =
  | "fashion"
  | "beauty"
  | "gadget"
  | "food"
  | "jewel"
  | "home"
  | "sport"
  | "luxury"
  | "flower"
  | "salon"
  | "book";

export type MallId =
  | "lane"
  | "community"
  | "fashion"
  | "metro"
  | "landmark"
  | "harbor"
  | "gallery"
  | "sky"
  | "royal"
  | "world";

type Appeal = Record<SegId, number>;

export type Category = {
  id: CategoryId;
  name: string;
  minMall: number;
  ticket: number;
  appeal: Appeal;
  floorA: string;
  floorB: string;
  aisle: string;
  accent: string;
  ink: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "fashion",
    name: "潮流服飾",
    minMall: 1,
    ticket: 460,
    appeal: { student: 0.86, office: 0.74, trend: 0.96, family: 0.4, vip: 0.46 },
    floorA: "#d5e4fb",
    floorB: "#c5d8f6",
    aisle: "#f7fbff",
    accent: "#3d64c4",
    ink: "#243868",
  },
  {
    id: "beauty",
    name: "美妝保養",
    minMall: 1,
    ticket: 420,
    appeal: { student: 0.62, office: 0.72, trend: 0.92, family: 0.55, vip: 0.62 },
    floorA: "#f8d5e6",
    floorB: "#f3c4da",
    aisle: "#fff7fb",
    accent: "#d4538c",
    ink: "#8a3058",
  },
  {
    id: "gadget",
    name: "電子潮玩",
    minMall: 1,
    ticket: 680,
    appeal: { student: 0.82, office: 0.64, trend: 0.88, family: 0.34, vip: 0.4 },
    floorA: "#d2f3f4",
    floorB: "#bfe8ea",
    aisle: "#f4ffff",
    accent: "#1f8f98",
    ink: "#145e66",
  },
  {
    id: "food",
    name: "美食廣場",
    minMall: 1,
    ticket: 250,
    appeal: { student: 0.8, office: 0.86, trend: 0.5, family: 0.96, vip: 0.34 },
    floorA: "#ffe0c2",
    floorB: "#f7d0a8",
    aisle: "#fff8f0",
    accent: "#e08a2e",
    ink: "#8a5410",
  },
  {
    id: "jewel",
    name: "珠寶配飾",
    minMall: 1,
    ticket: 820,
    appeal: { student: 0.28, office: 0.58, trend: 0.62, family: 0.42, vip: 0.96 },
    floorA: "#f8ecc4",
    floorB: "#f0e0a8",
    aisle: "#fffaf0",
    accent: "#d4a017",
    ink: "#7a5a10",
  },
  {
    id: "home",
    name: "家居生活",
    minMall: 1,
    ticket: 500,
    appeal: { student: 0.3, office: 0.72, trend: 0.46, family: 0.92, vip: 0.5 },
    floorA: "#dceccf",
    floorB: "#cfe3bf",
    aisle: "#f7fff4",
    accent: "#5a9a52",
    ink: "#2f5c2c",
  },
  {
    id: "sport",
    name: "運動戶外",
    minMall: 1,
    ticket: 440,
    appeal: { student: 0.74, office: 0.58, trend: 0.52, family: 0.78, vip: 0.32 },
    floorA: "#ffd5ce",
    floorB: "#f7c4bb",
    aisle: "#fff6f4",
    accent: "#e15a48",
    ink: "#8a3228",
  },
  {
    id: "luxury",
    name: "精品名店",
    minMall: 3,
    ticket: 2400,
    appeal: { student: 0.16, office: 0.42, trend: 0.72, family: 0.26, vip: 1 },
    floorA: "#e6e4f2",
    floorB: "#d8d5e8",
    aisle: "#f7f4ee",
    accent: "#d4b15a",
    ink: "#232838",
  },
  {
    id: "flower",
    name: "花藝禮品",
    minMall: 1,
    ticket: 390,
    appeal: { student: 0.42, office: 0.7, trend: 0.64, family: 0.96, vip: 0.58 },
    floorA: "#e7f6df",
    floorB: "#d7efcc",
    aisle: "#f4fff6",
    accent: "#3f8f55",
    ink: "#245c34",
  },
  {
    id: "salon",
    name: "美髮沙龍",
    minMall: 1,
    ticket: 540,
    appeal: { student: 0.74, office: 0.8, trend: 0.96, family: 0.46, vip: 0.6 },
    floorA: "#d9f3f8",
    floorB: "#c9eaf2",
    aisle: "#fff5f8",
    accent: "#e56b9a",
    ink: "#8a3060",
  },
  {
    id: "book",
    name: "書店文具",
    minMall: 1,
    ticket: 340,
    appeal: { student: 0.94, office: 0.86, trend: 0.48, family: 0.7, vip: 0.34 },
    floorA: "#f6ead4",
    floorB: "#eddcbd",
    aisle: "#fff8ee",
    accent: "#c47a3a",
    ink: "#6a3e18",
  },
];

export type Product = {
  id: string;
  cat: CategoryId;
  name: string;
  tier: Tier;
  minLux: number;
  minMall: number;
};

export const PRODUCTS: Product[] = [
  { id: "fashion-tee", cat: "fashion", name: "基本棉 T", tier: "mass", minLux: 1, minMall: 1 },
  { id: "fashion-jacket", cat: "fashion", name: "季節外套", tier: "mid", minLux: 1, minMall: 1 },
  { id: "fashion-sneaker", cat: "fashion", name: "聯名球鞋", tier: "premium", minLux: 2, minMall: 1 },
  { id: "fashion-designer", cat: "fashion", name: "設計師單品", tier: "premium", minLux: 3, minMall: 2 },
  { id: "beauty-open", cat: "beauty", name: "開架彩妝", tier: "mass", minLux: 1, minMall: 1 },
  { id: "beauty-skin", cat: "beauty", name: "日常保養", tier: "mid", minLux: 1, minMall: 1 },
  { id: "beauty-scent", cat: "beauty", name: "沙龍香氛", tier: "premium", minLux: 2, minMall: 1 },
  { id: "beauty-clinic", cat: "beauty", name: "醫美保養", tier: "premium", minLux: 4, minMall: 3 },
  { id: "gadget-acc", cat: "gadget", name: "手機配件", tier: "mass", minLux: 1, minMall: 1 },
  { id: "gadget-audio", cat: "gadget", name: "耳機音響", tier: "mid", minLux: 1, minMall: 1 },
  { id: "gadget-figure", cat: "gadget", name: "限定潮玩", tier: "premium", minLux: 2, minMall: 1 },
  { id: "gadget-flag", cat: "gadget", name: "旗艦新品", tier: "premium", minLux: 3, minMall: 2 },
  { id: "food-snack", cat: "food", name: "平價小食", tier: "mass", minLux: 1, minMall: 1 },
  { id: "food-drink", cat: "food", name: "手搖飲品", tier: "mid", minLux: 1, minMall: 1 },
  { id: "food-meal", cat: "food", name: "正餐便當", tier: "mid", minLux: 1, minMall: 1 },
  { id: "food-dessert", cat: "food", name: "名店甜點", tier: "premium", minLux: 2, minMall: 2 },
  { id: "jewel-stud", cat: "jewel", name: "日常飾品", tier: "mass", minLux: 1, minMall: 1 },
  { id: "jewel-silver", cat: "jewel", name: "銀飾", tier: "mid", minLux: 2, minMall: 1 },
  { id: "jewel-gold", cat: "jewel", name: "黃金小件", tier: "premium", minLux: 3, minMall: 2 },
  { id: "jewel-gem", cat: "jewel", name: "寶石高訂", tier: "premium", minLux: 4, minMall: 3 },
  { id: "home-soft", cat: "home", name: "布織寢具", tier: "mass", minLux: 1, minMall: 1 },
  { id: "home-aroma", cat: "home", name: "居家香氛", tier: "mid", minLux: 1, minMall: 1 },
  { id: "home-kitchen", cat: "home", name: "餐廚選物", tier: "mid", minLux: 2, minMall: 1 },
  { id: "home-design", cat: "home", name: "設計師家具", tier: "premium", minLux: 3, minMall: 2 },
  { id: "sport-basic", cat: "sport", name: "基礎運動服", tier: "mass", minLux: 1, minMall: 1 },
  { id: "sport-shoe", cat: "sport", name: "跑鞋", tier: "mid", minLux: 1, minMall: 1 },
  { id: "sport-camp", cat: "sport", name: "露營用具", tier: "mid", minLux: 2, minMall: 1 },
  { id: "sport-pro", cat: "sport", name: "專業裝備", tier: "premium", minLux: 3, minMall: 2 },
  { id: "flower-bunch", cat: "flower", name: "單束花", tier: "mass", minLux: 1, minMall: 1 },
  { id: "flower-pot", cat: "flower", name: "桌面盆栽", tier: "mid", minLux: 1, minMall: 1 },
  { id: "flower-gift", cat: "flower", name: "禮盒花藝", tier: "premium", minLux: 2, minMall: 1 },
  { id: "flower-wedding", cat: "flower", name: "婚禮花拱", tier: "premium", minLux: 3, minMall: 2 },
  { id: "salon-cut", cat: "salon", name: "剪髮", tier: "mass", minLux: 1, minMall: 1 },
  { id: "salon-color", cat: "salon", name: "染燙", tier: "mid", minLux: 1, minMall: 1 },
  { id: "salon-care", cat: "salon", name: "護髮", tier: "mid", minLux: 2, minMall: 1 },
  { id: "salon-style", cat: "salon", name: "造型設計", tier: "premium", minLux: 3, minMall: 2 },
  { id: "book-mag", cat: "book", name: "雜誌", tier: "mass", minLux: 1, minMall: 1 },
  { id: "book-pen", cat: "book", name: "文具", tier: "mid", minLux: 1, minMall: 1 },
  { id: "book-novel", cat: "book", name: "小說", tier: "mid", minLux: 1, minMall: 1 },
  { id: "book-art", cat: "book", name: "畫冊", tier: "premium", minLux: 2, minMall: 2 },
  { id: "luxury-scarf", cat: "luxury", name: "精品小物", tier: "mid", minLux: 1, minMall: 3 },
  { id: "luxury-bag", cat: "luxury", name: "皮革配件", tier: "premium", minLux: 2, minMall: 3 },
  { id: "luxury-watch", cat: "luxury", name: "腕錶", tier: "premium", minLux: 3, minMall: 4 },
  { id: "luxury-haute", cat: "luxury", name: "高訂限定", tier: "premium", minLux: 4, minMall: 4 },
  { id: "fashion-atelier", cat: "fashion", name: "高訂成衣", tier: "premium", minLux: 4, minMall: 6 },
  { id: "beauty-atelier", cat: "beauty", name: "訂製香氛", tier: "premium", minLux: 5, minMall: 7 },
  { id: "gadget-lab", cat: "gadget", name: "概念原型", tier: "premium", minLux: 4, minMall: 6 },
  { id: "food-omakase", cat: "food", name: "主廚套餐", tier: "premium", minLux: 4, minMall: 6 },
  { id: "jewel-archive", cat: "jewel", name: "古董珠寶", tier: "premium", minLux: 5, minMall: 8 },
  { id: "home-gallery", cat: "home", name: "藝廊家具", tier: "premium", minLux: 4, minMall: 7 },
  { id: "sport-court", cat: "sport", name: "球場限定", tier: "premium", minLux: 4, minMall: 6 },
  { id: "luxury-couture", cat: "luxury", name: "高訂禮服", tier: "premium", minLux: 5, minMall: 6 },
  { id: "luxury-salon", cat: "luxury", name: "私人沙龍", tier: "premium", minLux: 6, minMall: 9 },
];

export type MallDef = {
  id: MallId;
  name: string;
  short: string;
  sign: string;
  blurb: string;
  floors: number;
  luxuryCap: number;
  tier: number;
  baseTraffic: number;
  ticketMult: number;
  wage: number;
  costMult: number;
  buildCost: number;
  audience: SegId[];
};

export const MALLS: MallDef[] = [
  {
    id: "lane",
    name: "巷口小舖",
    short: "巷口",
    sign: "巷口小舖",
    blurb: "兩層街角，先把第一筆客人留下來。",
    floors: 2,
    luxuryCap: 2,
    tier: 1,
    baseTraffic: 100,
    ticketMult: 1,
    wage: 260,
    costMult: 1,
    buildCost: 0,
    audience: ["student", "family", "office"],
  },
  {
    id: "community",
    name: "社區商場",
    short: "社區",
    sign: "社區商場",
    blurb: "四層生活館，鄰居會專程過來。",
    floors: 4,
    luxuryCap: 3,
    tier: 2,
    baseTraffic: 168,
    ticketMult: 1.2,
    wage: 400,
    costMult: 1.18,
    buildCost: 48_000,
    audience: ["family", "office"],
  },
  {
    id: "fashion",
    name: "時尚百貨",
    short: "百貨",
    sign: "潮市百貨",
    blurb: "六層潮流旗艦，城市開始用你的名字認路。",
    floors: 6,
    luxuryCap: 4,
    tier: 3,
    baseTraffic: 260,
    ticketMult: 1.42,
    wage: 560,
    costMult: 1.38,
    buildCost: 168_000,
    audience: ["trend", "student"],
  },
  {
    id: "metro",
    name: "都會名店",
    short: "都會",
    sign: "都會名店",
    blurb: "八層精品樓，貴客把這裡當約會起點。",
    floors: 8,
    luxuryCap: 5,
    tier: 4,
    baseTraffic: 380,
    ticketMult: 1.75,
    wage: 780,
    costMult: 1.64,
    buildCost: 520_000,
    audience: ["office", "vip"],
  },
  {
    id: "landmark",
    name: "地標巨廈",
    short: "地標",
    sign: "地標巨廈",
    blurb: "十層地標。過了這裡，城裡還有更貴的客在等。",
    floors: 10,
    luxuryCap: 6,
    tier: 5,
    baseTraffic: 540,
    ticketMult: 2.15,
    wage: 1020,
    costMult: 1.95,
    buildCost: 1_360_000,
    audience: ["vip", "trend"],
  },
  {
    id: "harbor",
    name: "海港商場",
    short: "海港",
    sign: "海港商場",
    blurb: "海風把週末家庭整車送來，人潮比地標更密。",
    floors: 10,
    luxuryCap: 6,
    tier: 6,
    baseTraffic: 660,
    ticketMult: 2.4,
    wage: 1180,
    costMult: 2.15,
    buildCost: 2_400_000,
    audience: ["family", "office"],
  },
  {
    id: "gallery",
    name: "藝文廣場",
    short: "藝文",
    sign: "藝文廣場",
    blurb: "展覽結束，潮人會順路進店，願意為選品多付一點。",
    floors: 10,
    luxuryCap: 6,
    tier: 7,
    baseTraffic: 780,
    ticketMult: 2.7,
    wage: 1360,
    costMult: 2.38,
    buildCost: 4_200_000,
    audience: ["trend"],
  },
  {
    id: "sky",
    name: "雲端廣場",
    short: "雲端",
    sign: "雲端廣場",
    blurb: "觀景層讓貴客願意多留，客單再跳一檔。",
    floors: 10,
    luxuryCap: 7,
    tier: 8,
    baseTraffic: 920,
    ticketMult: 3.05,
    wage: 1560,
    costMult: 2.62,
    buildCost: 7_200_000,
    audience: ["vip", "trend"],
  },
  {
    id: "royal",
    name: "皇族會所",
    short: "皇族",
    sign: "皇族會所",
    blurb: "會員才進得來。人可以少，但幾乎都是貴客。",
    floors: 10,
    luxuryCap: 7,
    tier: 9,
    baseTraffic: 1040,
    ticketMult: 3.4,
    wage: 1760,
    costMult: 2.9,
    buildCost: 12_000_000,
    audience: ["vip"],
  },
  {
    id: "world",
    name: "世界旗艦",
    short: "旗艦",
    sign: "世界旗艦",
    blurb: "十座的終點。這座城最潮的店。",
    floors: 10,
    luxuryCap: 8,
    tier: 10,
    baseTraffic: 1200,
    ticketMult: 3.85,
    wage: 1980,
    costMult: 3.2,
    buildCost: 18_000_000,
    audience: ["vip", "trend"],
  },
];

export type Marketing = {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  traffic: number;
  conv: number;
  margin: number;
  minTier: number;
  seg: Partial<Record<SegId, number>>;
};

export const MARKETING: Marketing[] = [
  {
    id: "none",
    name: "暫不宣傳",
    blurb: "省下預算，靠地段自然客。",
    cost: 0,
    traffic: 1,
    conv: 0,
    margin: 0,
    minTier: 1,
    seg: {},
  },
  {
    id: "street",
    name: "街頭燈箱",
    blurb: "馬路對面就看得到，什麼客都多一點。",
    cost: 680,
    traffic: 1.26,
    conv: 0.02,
    margin: 0,
    minTier: 1,
    seg: {},
  },
  {
    id: "sale",
    name: "全館折扣",
    blurb: "人變多、利潤變薄，適合想衝人潮的時候。",
    cost: 420,
    traffic: 1.4,
    conv: 0.07,
    margin: -0.09,
    minTier: 1,
    seg: { student: 1.28, family: 1.2 },
  },
  {
    id: "influencer",
    name: "網紅打卡",
    blurb: "潮人會湧向服飾、美妝和潮玩。",
    cost: 1100,
    traffic: 1.14,
    conv: 0.03,
    margin: -0.01,
    minTier: 1,
    seg: { trend: 1.9 },
  },
  {
    id: "family",
    name: "週末市集",
    blurb: "家庭客愛美食、家居和運動。",
    cost: 860,
    traffic: 1.16,
    conv: 0.03,
    margin: 0,
    minTier: 1,
    seg: { family: 1.85, student: 1.12 },
  },
  {
    id: "vip",
    name: "會員日",
    blurb: "貴客與熟客專場，客單價更高，人潮稍少。",
    cost: 1320,
    traffic: 0.94,
    conv: 0.05,
    margin: 0.03,
    minTier: 2,
    seg: { vip: 2.05, office: 1.25 },
  },
  {
    id: "collab",
    name: "聯名快閃",
    blurb: "話題強，年輕客會為了限定款上門。",
    cost: 2200,
    traffic: 1.24,
    conv: 0.04,
    margin: 0.01,
    minTier: 2,
    seg: { trend: 1.6, student: 1.35 },
  },
  {
    id: "week",
    name: "時尚週",
    blurb: "大預算造勢，整座館變成目的地。",
    cost: 3800,
    traffic: 1.5,
    conv: 0.05,
    margin: -0.02,
    minTier: 3,
    seg: { trend: 1.7, vip: 1.35 },
  },
  {
    id: "lights",
    name: "港邊燈海",
    blurb: "海岸線都看得到，家庭和潮人一起湧來。",
    cost: 6400,
    traffic: 1.38,
    conv: 0.04,
    margin: -0.02,
    minTier: 6,
    seg: { family: 1.4, trend: 1.3 },
  },
  {
    id: "salon",
    name: "私人預覽",
    blurb: "只請貴客。人少，客單與利潤都更厚。",
    cost: 9200,
    traffic: 0.86,
    conv: 0.06,
    margin: 0.05,
    minTier: 8,
    seg: { vip: 2.4, office: 1.15 },
  },
];

export const SHELL = {
  floorA: "#d7dee6",
  floorB: "#cdd5df",
  aisle: "#eef2f6",
  accent: "#8b97a6",
  ink: "#607084",
};

const FLOOR_COST = [0, 8000, 13000, 19000, 27000, 37000, 50000, 66000, 86000, 110000];

export type FloorState = {
  built: boolean;
  category: CategoryId | null;
  products: string[];
  luxury: number;
};

export type MallState = {
  built: boolean;
  floors: FloorState[];
};

export function mallById(id: MallId): MallDef {
  return MALLS.find((m) => m.id === id) ?? MALLS[0];
}

export function categoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function productById(id: string): Product | undefined {
  return PRODUCTS.filter((p) => p.id === id)[0];
}

export function marketingById(id: string): Marketing {
  return MARKETING.find((m) => m.id === id) ?? MARKETING[0];
}

export function productUnlocked(p: Product, luxury: number, mallTier: number): boolean {
  return luxury >= p.minLux && mallTier >= p.minMall;
}

export function defaultProducts(cat: CategoryId, luxury: number, mallTier: number): string[] {
  const all = PRODUCTS.filter((p) => p.cat === cat && productUnlocked(p, luxury, mallTier));
  const basic = all.filter((p) => p.tier !== "premium");
  const pick = basic.length > 0 ? basic : all;
  return pick.map((p) => p.id);
}

export function floorOpenCost(def: MallDef, index: number): number {
  const base = FLOOR_COST[index] ?? 120000;
  return Math.round(base * def.costMult);
}

export function luxuryUpgradeCost(def: MallDef, index: number, luxury: number): number {
  return Math.round((2400 + index * 480) * luxury * def.costMult);
}

export function floorReady(floor: FloorState, cap: number): boolean {
  return floor.built && !!floor.category && floor.products.length > 0 && floor.luxury >= cap;
}

export function mallComplete(mall: MallState, def: MallDef): boolean {
  if (!mall.built) return false;
  return mall.floors.every((floor) => floorReady(floor, def.luxuryCap));
}

export function nextUnbuiltMall(malls: Record<MallId, MallState>): MallDef | null {
  return MALLS.find((m) => !malls[m.id]?.built) ?? null;
}

export function tierLabel(tier: Tier): string {
  if (tier === "mass") return "平價";
  if (tier === "mid") return "中價";
  return "精品";
}

export function audienceLabel(ids: SegId[]): string {
  return ids.map((id) => SEGMENTS.find((seg) => seg.id === id)?.name ?? id).join("、");
}

export function categoryLock(cat: CategoryId, mallTier: number): string | null {
  const c = categoryById(cat);
  if (c.minMall <= mallTier) return null;
  const mall = MALLS.find((m) => m.tier === c.minMall);
  return `需要${mall?.name ?? "更高級商場"}`;
}

export function productLock(p: Product, luxury: number, mallTier: number): string | null {
  if (p.minMall > mallTier) {
    const mall = MALLS.find((m) => m.tier === p.minMall);
    return `需要${mall?.name ?? "更高級商場"}`;
  }
  if (p.minLux > luxury) return `需要裝潢 ${p.minLux} 級`;
  return null;
}

export function marketingLock(m: Marketing, mallTier: number): string | null {
  if (m.minTier <= mallTier) return null;
  const mall = MALLS.find((mallDef) => mallDef.tier === m.minTier);
  return `需要${mall?.name ?? "更高級商場"}`;
}

const SEG_NAME: Record<SegId, string> = {
  student: "學生",
  office: "上班族",
  trend: "潮人",
  family: "家庭",
  vip: "貴客",
};

export function effectLines(m: Marketing): string[] {
  const lines: string[] = [];
  if (m.traffic >= 1.35) lines.push("人潮大增");
  else if (m.traffic >= 1.12) lines.push("人潮增加");
  else if (m.traffic >= 1.02) lines.push("人潮微增");
  else if (m.traffic < 0.98) lines.push("人潮稍少");
  if (m.conv >= 0.04) lines.push("更容易成交");
  if (m.margin <= -0.03) lines.push("利潤變薄");
  else if (m.margin >= 0.02) lines.push("利潤變厚");
  for (const seg of SEGMENTS) {
    const boost = m.seg[seg.id];
    if (boost && boost >= 1.3) lines.push(`偏愛${SEG_NAME[seg.id]}`);
  }
  if (lines.length === 0) lines.push("維持現狀");
  return lines;
}

export function emptyMalls(): Record<MallId, MallState> {
  const malls = {} as Record<MallId, MallState>;
  for (const def of MALLS) {
    const built = def.id === "lane";
    malls[def.id] = {
      built,
      floors: Array.from({ length: def.floors }, (_, index) => ({
        built: built && index === 0,
        category: built && index === 0 ? "fashion" : null,
        products: built && index === 0 ? defaultProducts("fashion", 1, 1) : [],
        luxury: 1,
      })),
    };
  }
  return malls;
}
