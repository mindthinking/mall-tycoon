import {
  BookOpen,
  Building2,
  Crown,
  Dumbbell,
  Flower2,
  Gamepad2,
  Gem,
  Megaphone,
  Scissors,
  Shirt,
  Sofa,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  CATEGORIES,
  MARKETING,
  PRODUCTS,
  categoryById,
  audienceLabel,
  categoryLock,
  effectLines,
  floorOpenCost,
  floorReady,
  luxuryUpgradeCost,
  marketingLock,
  productLock,
  tierLabel,
  type CategoryId,
  type FloorState,
  type MallDef,
} from "@/game/catalog";
import { money } from "@/game/format";
import type { DayResult, MallResult } from "@/game/sim";

const ICONS = {
  fashion: Shirt,
  beauty: Sparkles,
  gadget: Gamepad2,
  food: UtensilsCrossed,
  jewel: Gem,
  home: Sofa,
  sport: Dumbbell,
  luxury: Crown,
  flower: Flower2,
  salon: Scissors,
  book: BookOpen,
} as const;

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} 顆星`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= value ? "star on" : "star"} strokeWidth={2} aria-hidden />
      ))}
    </span>
  );
}

export function GuestHud({
  mallName,
  audience,
  segments,
}: {
  mallName: string;
  audience: MallResult["segments"][number]["id"][];
  segments: MallResult["segments"];
}) {
  const max = Math.max(1, ...segments.map((seg) => seg.visitors));
  const top = segments.reduce((best, seg) => (seg.visitors > best.visitors ? seg : best), segments[0]);
  const total = segments.reduce((sum, seg) => sum + seg.visitors, 0);
  const wanted = new Set(audience);
  return (
    <div className="guest-hud" role="status" aria-label={`${mallName}的客人`}>
      <div className="guest-head">
        <span>目標 {audienceLabel(audience)}</span>
        <strong>{top && total > 0 ? `最多${top.name}` : "還沒有客人"}</strong>
      </div>
      <div className="guest-row">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={[
              "guest",
              wanted.has(seg.id) ? "target" : "",
              seg.id === top?.id && seg.visitors > 0 ? "lead" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{seg.name}</span>
            <b>{seg.visitors.toLocaleString("zh-Hant")}</b>
            <i style={{ width: `${Math.round((seg.visitors / max) * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-back" role="presentation" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="關閉">
            <X aria-hidden />
          </button>
        </div>
        <div className="sheet-scroll">{children}</div>
      </div>
    </div>
  );
}

export function FloorPanel({
  index,
  floor,
  tier,
  cap,
  cash,
  mall,
  onCategory,
  onToggle,
  onUpgrade,
}: {
  index: number;
  floor: FloorState;
  tier: number;
  cap: number;
  cash: number;
  mall: MallDef;
  onCategory: (id: CategoryId) => void;
  onToggle: (id: string) => void;
  onUpgrade: () => void;
}) {
  if (!floor.built) {
    return <p>這層還沒蓋。到「擴建商場」開設 {index + 1}F。</p>;
  }
  const upgradeCost = floor.luxury < cap ? luxuryUpgradeCost(mall, index, floor.luxury) : null;
  const goods = PRODUCTS.filter((product) => product.cat === floor.category);
  return (
    <>
      <h3 className="block-title">這層賣什麼</h3>
      <div className="cat-grid">
        {CATEGORIES.map((cat) => {
          const lock = categoryLock(cat.id, tier);
          const Icon = ICONS[cat.id];
          const on = floor.category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={on ? "cat on" : "cat"}
              disabled={!!lock}
              aria-pressed={on}
              onClick={() => onCategory(cat.id)}
            >
              <Icon aria-hidden />
              <span>{cat.name}</span>
              {lock ? <small>{lock}</small> : null}
            </button>
          );
        })}
      </div>
      <h3 className="block-title">容許上架</h3>
      {!floor.category ? (
        <p className="fine">先選這一層賣什麼，才能決定容許哪些貨。</p>
      ) : (
        <ul className="product-list">
          {goods.map((product) => {
            const lock = productLock(product, floor.luxury, tier);
            const on = floor.products.includes(product.id);
            return (
              <li key={product.id} className="product">
                <div>
                  <strong>{product.name}</strong>
                  <small>
                    {tierLabel(product.tier)}
                    {lock ? ` · ${lock}` : ""}
                  </small>
                </div>
                {lock ? (
                  <span className="tag">未開放</span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${on ? "下架" : "容許"} ${product.name}`}
                    className={on ? "switch on" : "switch"}
                    onClick={() => onToggle(product.id)}
                  >
                    <span />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <h3 className="block-title">裝潢 {floor.luxury} / {cap} 級</h3>
      <p className="fine">裝潢愈高，客單愈高。這座起滿的標準是 {cap} 級。</p>
      {upgradeCost == null ? (
        <p className="tag">已達這座商場的裝潢標準</p>
      ) : (
        <button type="button" className="btn" disabled={cash < upgradeCost} onClick={onUpgrade}>
          升級裝潢 · {money(upgradeCost)}
        </button>
      )}
    </>
  );
}

export function MarketingPanel({
  tier,
  current,
  onPick,
}: {
  tier: number;
  current: string;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <p className="fine">行銷算整座商場，開舖當天扣除費用。換方案會立刻改預估。</p>
      <div className="stack">
        {MARKETING.map((plan) => {
          const lock = marketingLock(plan, tier);
          const on = current === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              className={on ? "plan on" : "plan"}
              disabled={!!lock}
              aria-pressed={on}
              onClick={() => onPick(plan.id)}
            >
              <span className="plan-title">
                <Megaphone aria-hidden />
                {plan.name}
                <em>{plan.cost === 0 ? "免費" : money(plan.cost)}</em>
              </span>
              <small>{lock ?? plan.blurb}</small>
              {!lock && <small>{effectLines(plan).join(" · ")}</small>}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function ExpandPanel({
  floors,
  cap,
  cash,
  mall,
  complete,
  next,
  showBuild,
  onUpgrade,
  onOpen,
  onBuild,
  onLook,
}: {
  floors: FloorState[];
  cap: number;
  cash: number;
  mall: MallDef;
  complete: boolean;
  next: MallDef | null;
  showBuild: boolean;
  onUpgrade: (index: number) => void;
  onOpen: (index: number) => void;
  onBuild: () => void;
  onLook: (index: number) => void;
}) {
  const ready = floors.filter((floor) => floorReady(floor, cap)).length;
  const nextIndex = floors.findIndex((floor) => !floor.built);
  const openCost = nextIndex >= 0 ? floorOpenCost(mall, nextIndex) : 0;
  return (
    <>
      <p className="fine">
        起滿進度 {ready}/{floors.length}。每一層都要開業、有貨，而且裝潢到 {cap} 級。
      </p>
      <div className="meter" aria-hidden>
        <span style={{ width: `${(ready / floors.length) * 100}%` }} />
      </div>
      <ul className="stack">
        {floors.map((floor, index) => {
          const name = floor.category ? categoryById(floor.category).name : floor.built ? "未規劃" : "尚未興建";
          const cost = floor.built && floor.luxury < cap ? luxuryUpgradeCost(mall, index, floor.luxury) : null;
          return (
            <li key={index} className="floor-line">
              <button type="button" className="linkish" onClick={() => onLook(index)}>
                <strong>{index + 1}F</strong>
                <span>{name}</span>
                {floor.built && (
                  <small>
                    裝潢 {floor.luxury}/{cap}
                    {floorReady(floor, cap) ? " · 達標" : ""}
                  </small>
                )}
              </button>
              {cost != null && (
                <button type="button" className="btn slim" disabled={cash < cost} onClick={() => onUpgrade(index)}>
                  升級 {money(cost)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {nextIndex >= 0 && (
        <button type="button" className="btn-primary" disabled={cash < openCost} onClick={() => onOpen(nextIndex)}>
          開設 {nextIndex + 1}F · {money(openCost)}
        </button>
      )}
      {showBuild && next && (
        <div className="next-card">
          <p className="kicker">下一座 · 第 {next.tier} 座，共十座</p>
          <h3>{next.name}</h3>
          <p>
            {next.floors} 層 · 裝潢標準 {next.luxuryCap} 級
          </p>
          <p className="fine">客群 {audienceLabel(next.audience)}。{next.blurb}</p>
          <button type="button" className="btn-primary" disabled={!complete || cash < next.buildCost} onClick={onBuild}>
            興建 · {money(next.buildCost)}
          </button>
          {!complete && <p className="fine">先把這一座每一層都開好、上貨，並把裝潢升滿。</p>}
          {complete && cash < next.buildCost && <p className="fine">還差 {money(next.buildCost - cash)}。</p>}
        </div>
      )}
      {!next && complete && (
        <div className="next-card">
          <h3>十座都起滿</h3>
          <p>從巷口到世界旗艦，這座城最潮的店是你的。還可以每天繼續開舖。</p>
        </div>
      )}
      {!showBuild && complete && next && <p className="fine">這一座已經起滿。</p>}
    </>
  );
}

export function ReportDialog({ result, onClose }: { result: DayResult; onClose: () => void }) {
  const max = Math.max(1, ...result.malls.flatMap((mall) => mall.floors.map((floor) => Math.abs(floor.profit))));
  const title = result.profit < 0 ? "今天虧了" : result.stars >= 4 ? "今天很旺" : "打烊結算";
  return (
    <div className="sheet-back" role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <Stars value={result.stars} />
        </div>
        <div className="sheet-scroll">
          <p className="kicker">
            第 {result.day} 天 · {result.eventName}
          </p>
          <p className={result.profit < 0 ? "forecast neg" : "forecast"}>{money(result.profit, true)}</p>
          <p className="fine">
            來客 {result.visitors.toLocaleString("zh-Hant")} · 營業額 {money(result.revenue)} · 成本 {money(result.cost)}
          </p>
          <p className="fine">{result.eventDetail}</p>
          {result.malls.map((mall) => (
            <section key={mall.mallId} className="report-mall">
              <h3>
                {mall.name}
                <span>{money(mall.profit, true)}</span>
              </h3>
              <div className="guest-row report">
                {mall.segments.map((seg) => (
                  <div key={seg.id} className="guest">
                    <span>{seg.name}</span>
                    <b>{seg.visitors.toLocaleString("zh-Hant")}</b>
                  </div>
                ))}
              </div>
              <ul>
                {mall.floors.map((floor) => (
                  <li key={floor.index}>
                    <span>
                      {floor.index + 1}F {floor.name}
                    </span>
                    <span>{floor.open ? money(floor.profit, true) : "未營業"}</span>
                    <small>{floor.note}</small>
                    <i style={{ width: `${Math.min(100, (Math.abs(floor.profit) / max) * 100)}%` }} className={floor.profit < 0 ? "down" : ""} />
                  </li>
                ))}
              </ul>
              {mall.marketingCost > 0 && <p className="fine">行銷 {mall.marketingName} −{money(mall.marketingCost)}</p>}
              {mall.notes.map((note) => (
                <p key={note} className="fine">
                  {note}
                </p>
              ))}
            </section>
          ))}
          <button type="button" className="btn-primary" onClick={onClose}>
            繼續經營
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({
  mute,
  shake,
  onMute,
  onShake,
  onReset,
}: {
  mute: boolean;
  shake: boolean;
  onMute: () => void;
  onShake: () => void;
  onReset: () => void;
}) {
  return (
    <>
      <p className="fine">十座商場由街角蓋到旗艦。決定每層賣什麼、容許哪些貨、今天的行銷。每天開舖，客人自己進來。起滿一座，才能蓋下一座。</p>
      <div className="settings-row">
        <span>音效</span>
        <button type="button" role="switch" aria-checked={!mute} className={mute ? "switch" : "switch on"} onClick={onMute}>
          <span />
        </button>
      </div>
      <div className="settings-row">
        <span>結算震動</span>
        <button type="button" role="switch" aria-checked={shake} className={shake ? "switch on" : "switch"} onClick={onShake}>
          <span />
        </button>
      </div>
      <button type="button" className="btn danger" onClick={onReset}>
        重新開始
      </button>
    </>
  );
}

export function BuildingIcon() {
  return <Building2 aria-hidden />;
}
