import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, DoorOpen, Settings } from "lucide-react";
import { bindAudioVisibility, playChime, playCoin, playDeny, playTap, setMuted, unlockAudio } from "@/game/audio";
import {
  MALLS,
  audienceLabel,
  categoryById,
  floorOpenCost,
  mallById,
  mallComplete,
  marketingById,
  nextUnbuiltMall,
} from "@/game/catalog";
import { money } from "@/game/format";
import { coachLine, simulate, warnings, type DayResult } from "@/game/sim";
import { toInput, useGame } from "@/game/store";
import { MallStage, OPEN_MS, OPEN_MS_REDUCED } from "./MallStage";
import { BuildingIcon, ExpandPanel, FloorPanel, GuestHud, MarketingPanel, ReportDialog, SettingsPanel, Sheet, Stars } from "./panels";
import { Splash } from "./Splash";

type SheetId = "floor" | "marketing" | "expand" | "settings" | null;

function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const unsub = useGame.persist.onFinishHydration(() => setReady(true));
    if (useGame.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);
  return ready;
}

function useReduced() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setOn(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return on;
}

export function GameApp() {
  const hydrated = useHydrated();
  const reduced = useReduced();
  const save = useGame();
  const [sheet, setSheet] = useState<SheetId>(null);
  const [floor, setFloor] = useState(0);
  const [phase, setPhase] = useState<"idle" | "open" | "report">("idle");
  const [pending, setPending] = useState<DayResult | null>(null);
  const [shownCash, setShownCash] = useState(save.cash);
  const [progress, setProgress] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const playing = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => bindAudioVisibility(), []);
  useEffect(() => {
    const onPointer = () => {
      unlockAudio();
      setMuted(useGame.getState().mute);
    };
    window.addEventListener("pointerdown", onPointer, { once: true });
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);
  useEffect(() => {
    if (phase !== "open") setShownCash(save.cash);
  }, [save.cash, phase]);

  useEffect(() => {
    if (phase !== "open" || !pending) return;
    const from = save.cash;
    const to = save.cash + pending.profit;
    const dur = reduced ? OPEN_MS_REDUCED : OPEN_MS;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setProgress(p);
      const eased = 1 - (1 - p) ** 2;
      setShownCash(Math.round(from + (to - from) * eased));
      if (p < 1 && phaseRef.current === "open") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, pending, reduced, save.cash]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (phaseRef.current === "report") return;
      setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const input = useMemo(() => toInput(save), [save]);
  const forecast = useMemo(() => simulate(input), [input]);
  const warn = warnings(input);
  const coach = coachLine(input, save.cash);
  const mall = save.malls[save.activeMall];
  const def = mallById(save.activeMall);
  const audienceNames = audienceLabel(def.audience);
  const switcher = useRef<HTMLDivElement>(null);
  const builtCount = MALLS.filter((item) => save.malls[item.id]?.built).length;
  const nextMall = nextUnbuiltMall(save.malls);
  const nextIndex = nextMall ? MALLS.findIndex((item) => item.id === nextMall.id) : -1;
  const prevOfNext = nextIndex > 0 ? MALLS[nextIndex - 1] : null;
  const complete = mallComplete(mall, def);
  const showBuild = !!nextMall && prevOfNext?.id === save.activeMall;
  const selected = mall?.floors[floor] ?? mall?.floors[0];
  const nextFloor = mall?.floors.findIndex((item) => !item.built) ?? -1;
  const canOpenFloor = nextFloor >= 0 && save.cash >= floorOpenCost(def, nextFloor);
  const canBuild = showBuild && complete && !!nextMall && save.cash >= nextMall.buildCost;
  const needsPlan = warn.some((line) => line.startsWith(`${floor + 1}F`) || line.includes(def.name));
  const mkt = marketingById(save.marketing[save.activeMall] ?? "none");
  const viewed = phase === "idle" ? forecast : (pending ?? forecast);
  const activeResult = viewed.malls.find((item) => item.mallId === save.activeMall) ?? viewed.malls[0];

  useEffect(() => {
    const root = switcher.current;
    const el = root?.querySelector<HTMLElement>(`[data-mall="${save.activeMall}"]`);
    if (!root || !el) return;
    const left = el.offsetLeft - root.clientWidth / 2 + el.clientWidth / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [save.activeMall, save.begun]);

  function finish() {
    const result = pending;
    if (!result || !playing.current) return;
    playing.current = false;
    save.commitDay(result.profit, result.stars, result.day, result.visitors);
    setPhase("report");
    setProgress(1);
    if (result.profit >= 0) playCoin();
    else playDeny();
  }

  function startDay() {
    if (playing.current || phase !== "idle") return;
    unlockAudio();
    setMuted(save.mute);
    const result = simulate(toInput(useGame.getState()));
    playing.current = true;
    setPending(result);
    setProgress(0);
    setSheet(null);
    setPhase("open");
    playChime();
  }

  function begin() {
    unlockAudio();
    setMuted(save.mute);
    save.begin();
    playChime();
  }

  if (!hydrated || !save.begun) {
    return <Splash ready={hydrated} onStart={begin} />;
  }

  if (!selected) return null;

  const model = {
    sign: def.sign,
    tier: def.tier,
    maxFloors: def.floors,
    floors: mall.floors
      .filter((item) => item.built)
      .map((item) => ({
        category: item.category,
        luxury: item.luxury,
        products: item.products.length,
      })),
    guests: (activeResult?.segments ?? []).map((seg) => ({ seg: seg.id, share: seg.visitors })),
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-row">
          <div>
            <p className="kicker">商場大亨</p>
            <p className="dayline">第 {save.day} 天 · {forecast.eventName}</p>
          </div>
          <button type="button" className="icon-btn" aria-label="設定" onClick={() => { playTap(); setConfirmReset(false); setSheet("settings"); }}>
            <Settings aria-hidden />
          </button>
        </div>
        <div className="cashline">
          <p className="num">
            <Coins aria-hidden />
            {money(shownCash)}
          </p>
          {save.lastStars != null ? <Stars value={save.lastStars} /> : <span className="fine">尚無昨日成績</span>}
        </div>
        <div className="mall-switch" role="tablist" aria-label="十座商場" ref={switcher}>
          {MALLS.map((item) => {
            const built = !!save.malls[item.id]?.built;
            const isNext = item.id === nextMall?.id;
            const on = item.id === save.activeMall;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-mall={item.id}
                aria-selected={on}
                aria-label={built ? item.name : isNext ? `下一座 ${item.name}` : `${item.name} 未興建`}
                disabled={!built && !isNext}
                className={on ? "mall-pill on" : isNext ? "mall-pill next" : built ? "mall-pill" : "mall-pill locked"}
                onClick={() => {
                  if (built) {
                    save.setActive(item.id);
                    setFloor(0);
                  } else if (isNext) setSheet("expand");
                  playTap();
                }}
              >
                <span className="no">{item.tier}</span>
                {item.short}
              </button>
            );
          })}
        </div>
        <p className="fine">已開 {builtCount} / {MALLS.length} 座 · {def.name} · 客群 {audienceNames}</p>
      </header>
      <div className="play">
        <div className="stage-wrap">
          <MallStage
            model={model}
            selected={mall.floors[floor]?.built ? floor : -1}
            playing={phase === "open"}
            profit={pending?.profit ?? 0}
            reduced={reduced}
            shakeOn={save.shakeOn}
            onSelect={(index) => {
              setFloor(index);
              playTap();
            }}
            onDone={finish}
          />
          <div className="floor-rail">
            {mall.floors.map((item, index) => (
              <button
                key={index}
                type="button"
                className={index === floor ? "rail-btn on" : item.built ? "rail-btn" : "rail-btn locked"}
                onClick={() => {
                  setFloor(index);
                  if (!item.built) setSheet("expand");
                  playTap();
                }}
              >
                {index + 1}F
              </button>
            ))}
          </div>
        </div>
        <section className="dock">
          <div className="dock-scroll">
            <div className="dock-top">
              <div className="dock-copy">
                <p className="forecast-label">預估淨利</p>
                <p className={forecast.profit < 0 ? "forecast neg" : "forecast"}>{money(forecast.profit, true)}</p>
                <p className="fine">
                  來客約 {forecast.visitors.toLocaleString("zh-Hant")} · {mkt.name}
                  {selected.built
                    ? ` · ${floor + 1}F ${selected.category ? categoryById(selected.category).name : "未規劃"}`
                    : ` · ${floor + 1}F 未蓋`}
                </p>
              </div>
              <img className="host" src="/art/host.png?v=ting6" alt="" />
            </div>
            {activeResult && <GuestHud mallName={def.short} audience={def.audience} segments={activeResult.segments} />}
            <p className={warn.length ? "coach warn" : "coach"}>霆總：{coach}</p>
            {builtCount > 1 && (
              <p className="fine">開舖時已開的 {builtCount} 座一起營業。客人面板是目前這座。</p>
            )}
            <div className="actions">
              <button type="button" className={needsPlan && phase === "idle" ? "btn pulse" : "btn"} disabled={phase !== "idle"} onClick={() => { setSheet("floor"); playTap(); }}>
                樓層規劃
              </button>
              <button type="button" className="btn" disabled={phase !== "idle"} onClick={() => { setSheet("marketing"); playTap(); }}>
                行銷方案
              </button>
              <button
                type="button"
                className={!needsPlan && phase === "idle" && (canOpenFloor || canBuild) ? "btn pulse" : "btn"}
                disabled={phase !== "idle"}
                onClick={() => { setSheet("expand"); playTap(); }}
              >
                <BuildingIcon /> 擴建
              </button>
            </div>
          </div>
          <div className="dock-foot">
            {phase === "open" && (
              <div className="bar" aria-hidden>
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            )}
            {phase === "open" ? (
              <button type="button" className="btn-primary" onClick={finish}>
                快轉結算
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={startDay} disabled={phase === "report"}>
                <DoorOpen aria-hidden /> 今日開舖
              </button>
            )}
          </div>
        </section>
      </div>
      {sheet === "floor" && (
        <Sheet title={`${floor + 1}F 樓層規劃`} onClose={() => setSheet(null)}>
          <p className="fine">目前預估淨利 {money(forecast.profit, true)}</p>
          <FloorPanel
            index={floor}
            floor={selected}
            tier={def.tier}
            cap={def.luxuryCap}
            cash={save.cash}
            mall={def}
            onCategory={(id) => { save.setCategory(floor, id); playTap(); }}
            onToggle={(id) => { save.toggleProduct(floor, id); playTap(); }}
            onUpgrade={() => { if (!save.upgrade(floor)) playDeny(); else playTap(); }}
          />
        </Sheet>
      )}
      {sheet === "marketing" && (
        <Sheet title="今日行銷" onClose={() => setSheet(null)}>
          <p className="fine">目前預估淨利 {money(forecast.profit, true)}</p>
          <MarketingPanel
            tier={def.tier}
            current={save.marketing[save.activeMall] ?? "none"}
            onPick={(id) => { save.setMarketing(id); playTap(); }}
          />
        </Sheet>
      )}
      {sheet === "expand" && (
        <Sheet title={`擴建 · ${def.name}`} onClose={() => setSheet(null)}>
          <ExpandPanel
            floors={mall.floors}
            cap={def.luxuryCap}
            cash={save.cash}
            mall={def}
            complete={complete}
            next={nextMall}
            showBuild={showBuild}
            onLook={(index) => { setFloor(index); setSheet(mall.floors[index]?.built ? "floor" : "expand"); }}
            onUpgrade={(index) => { if (!save.upgrade(index)) playDeny(); else playTap(); }}
            onOpen={(index) => {
              if (!save.openFloor(index)) playDeny();
              else {
                setFloor(index);
                setSheet("floor");
                playChime();
              }
            }}
            onBuild={() => {
              const id = save.buildNext();
              if (!id) playDeny();
              else {
                setFloor(0);
                setSheet("floor");
                playChime();
              }
            }}
          />
        </Sheet>
      )}
      {sheet === "settings" && (
        <Sheet title="設定" onClose={() => setSheet(null)}>
          <SettingsPanel
            mute={save.mute}
            shake={save.shakeOn}
            onMute={() => {
              const next = !save.mute;
              save.setMute(next);
              unlockAudio();
              setMuted(next);
              if (!next) playTap();
            }}
            onShake={() => save.setShake(!save.shakeOn)}
            onReset={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              playing.current = false;
              save.reset();
              setPhase("idle");
              setPending(null);
              setSheet(null);
              setFloor(0);
            }}
          />
          {confirmReset && <p className="fine">再按一次就會清掉這座城的進度。</p>}
        </Sheet>
      )}
      {phase === "report" && pending && (
        <ReportDialog
          result={pending}
          onClose={() => {
            setPhase("idle");
            setPending(null);
            playTap();
          }}
        />
      )}
    </div>
  );
}
