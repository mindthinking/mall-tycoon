import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  MALLS,
  categoryLock,
  defaultProducts,
  emptyMalls,
  floorOpenCost,
  luxuryUpgradeCost,
  mallById,
  mallComplete,
  marketingById,
  marketingLock,
  nextUnbuiltMall,
  productById,
  productLock,
  type CategoryId,
  type MallId,
  type MallState,
} from "./catalog";

export type Hist = { day: number; profit: number; stars: number; visitors: number };

export type SaveData = {
  begun: boolean;
  cash: number;
  day: number;
  lastStars: number | null;
  played: boolean;
  activeMall: MallId;
  mute: boolean;
  shakeOn: boolean;
  marketing: Record<MallId, string>;
  malls: Record<MallId, MallState>;
  history: Hist[];
};

type Actions = {
  begin: () => void;
  setActive: (id: MallId) => void;
  setMute: (mute: boolean) => void;
  setShake: (on: boolean) => void;
  setCategory: (index: number, cat: CategoryId) => void;
  toggleProduct: (index: number, productId: string) => void;
  setMarketing: (id: string) => void;
  upgrade: (index: number) => boolean;
  openFloor: (index: number) => boolean;
  buildNext: () => MallId | null;
  commitDay: (profit: number, stars: number, dayPlayed: number, visitors: number) => void;
  reset: () => void;
};

export type GameStore = SaveData & Actions;

function blankMarketing(): Record<MallId, string> {
  const marketing = {} as Record<MallId, string>;
  for (const def of MALLS) marketing[def.id] = "none";
  return marketing;
}

export function hydrateSave(p: Partial<SaveData> | undefined): SaveData {
  const fresh = freshSave();
  if (!p?.malls?.lane?.floors?.length) return fresh;
  const malls = emptyMalls();
  for (const def of MALLS) {
    const saved = p.malls?.[def.id];
    if (!saved?.floors?.length) continue;
    malls[def.id] = {
      built: !!saved.built,
      floors: Array.from({ length: def.floors }, (_, index) => {
        const floor = saved.floors[index];
        if (!floor) return { built: false, category: null, products: [], luxury: 1 };
        return {
          built: !!floor.built,
          category: floor.category ?? null,
          products: Array.isArray(floor.products) ? floor.products.filter((id) => typeof id === "string") : [],
          luxury: typeof floor.luxury === "number" ? floor.luxury : 1,
        };
      }),
    };
  }
  const marketing = blankMarketing();
  for (const def of MALLS) {
    const id = p.marketing?.[def.id];
    if (typeof id === "string") marketing[def.id] = id;
  }
  const active = p.activeMall && malls[p.activeMall]?.built ? p.activeMall : "lane";
  return {
    begun: !!p.begun,
    cash: typeof p.cash === "number" ? p.cash : fresh.cash,
    day: typeof p.day === "number" ? p.day : 1,
    lastStars: typeof p.lastStars === "number" ? p.lastStars : null,
    played: !!p.played,
    activeMall: active,
    mute: !!p.mute,
    shakeOn: p.shakeOn !== false,
    marketing,
    malls,
    history: Array.isArray(p.history) ? p.history.slice(-14) : [],
  };
}

export function freshSave(): SaveData {
  return {
    begun: false,
    cash: 6500,
    day: 1,
    lastStars: null,
    played: false,
    activeMall: "lane",
    mute: false,
    shakeOn: true,
    marketing: blankMarketing(),
    malls: emptyMalls(),
    history: [],
  };
}

function safeStorage() {
  if (typeof localStorage === "undefined") {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
    };
  }
  return {
    getItem: (k: string) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    setItem: (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* quota */
      }
    },
    removeItem: (k: string) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  };
}

function patchFloor(
  malls: Record<MallId, MallState>,
  mallId: MallId,
  index: number,
  floor: MallState["floors"][number],
): Record<MallId, MallState> {
  const mall = malls[mallId];
  const floors = mall.floors.map((item, i) => (i === index ? floor : item));
  return { ...malls, [mallId]: { ...mall, floors } };
}

export function toInput(s: SaveData) {
  return {
    day: s.day,
    activeMall: s.activeMall,
    marketing: s.marketing,
    malls: s.malls,
  };
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...freshSave(),
      begin: () => set({ begun: true }),
      setActive: (id) => {
        if (!get().malls[id]?.built) return;
        set({ activeMall: id });
      },
      setMute: (mute) => set({ mute }),
      setShake: (shakeOn) => set({ shakeOn }),
      setCategory: (index, cat) => {
        const s = get();
        const def = mallById(s.activeMall);
        const floor = s.malls[s.activeMall].floors[index];
        if (!floor?.built || categoryLock(cat, def.tier)) return;
        set({
          malls: patchFloor(s.malls, s.activeMall, index, {
            ...floor,
            category: cat,
            products: defaultProducts(cat, floor.luxury, def.tier),
          }),
        });
      },
      toggleProduct: (index, productId) => {
        const s = get();
        const def = mallById(s.activeMall);
        const floor = s.malls[s.activeMall].floors[index];
        const product = productById(productId);
        if (!floor?.built || !floor.category || !product || product.cat !== floor.category) return;
        if (productLock(product, floor.luxury, def.tier)) return;
        const has = floor.products.includes(productId);
        set({
          malls: patchFloor(s.malls, s.activeMall, index, {
            ...floor,
            products: has ? floor.products.filter((id) => id !== productId) : [...floor.products, productId],
          }),
        });
      },
      setMarketing: (id) => {
        const s = get();
        const def = mallById(s.activeMall);
        const chosen = marketingById(id);
        if (chosen.id !== id) return;
        if (marketingLock(chosen, def.tier)) return;
        set({ marketing: { ...s.marketing, [s.activeMall]: chosen.id } });
      },
      upgrade: (index) => {
        const s = get();
        const def = mallById(s.activeMall);
        const floor = s.malls[s.activeMall].floors[index];
        if (!floor?.built || floor.luxury >= def.luxuryCap) return false;
        const cost = luxuryUpgradeCost(def, index, floor.luxury);
        if (s.cash < cost) return false;
        set({
          cash: s.cash - cost,
          malls: patchFloor(s.malls, s.activeMall, index, { ...floor, luxury: floor.luxury + 1 }),
        });
        return true;
      },
      openFloor: (index) => {
        const s = get();
        const def = mallById(s.activeMall);
        const mall = s.malls[s.activeMall];
        const next = mall.floors.findIndex((floor) => !floor.built);
        if (next !== index) return false;
        const cost = floorOpenCost(def, index);
        if (s.cash < cost) return false;
        const floor = mall.floors[index];
        if (!floor) return false;
        set({
          cash: s.cash - cost,
          malls: patchFloor(s.malls, s.activeMall, index, {
            built: true,
            category: null,
            products: [],
            luxury: 1,
          }),
        });
        return true;
      },
      buildNext: () => {
        const s = get();
        const nxt = nextUnbuiltMall(s.malls);
        if (!nxt) return null;
        const prev = MALLS[MALLS.findIndex((m) => m.id === nxt.id) - 1];
        if (!prev || !mallComplete(s.malls[prev.id], prev)) return null;
        if (s.cash < nxt.buildCost) return null;
        const mall = s.malls[nxt.id];
        const floors = mall.floors.map((floor, index) =>
          index === 0 ? { built: true, category: null, products: [], luxury: 1 } : floor,
        );
        set({
          cash: s.cash - nxt.buildCost,
          activeMall: nxt.id,
          malls: { ...s.malls, [nxt.id]: { built: true, floors } },
        });
        return nxt.id;
      },
      commitDay: (profit, stars, dayPlayed, visitors) =>
        set((s) => ({
          cash: s.cash + profit,
          day: s.day + 1,
          played: true,
          lastStars: stars,
          history: [...s.history, { day: dayPlayed, profit, stars, visitors }].slice(-14),
        })),
      reset: () => set(freshSave()),
    }),
    {
      name: "chaoshi-tycoon-v1",
      version: 2,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({
        begun: s.begun,
        cash: s.cash,
        day: s.day,
        lastStars: s.lastStars,
        played: s.played,
        activeMall: s.activeMall,
        mute: s.mute,
        shakeOn: s.shakeOn,
        marketing: s.marketing,
        malls: s.malls,
        history: s.history,
      }),
      migrate: (persisted) => hydrateSave(persisted as Partial<SaveData>),
      merge: (persisted, current) => ({ ...current, ...hydrateSave(persisted as Partial<SaveData>) }),
    },
  ),
);
