import { useEffect, useRef } from "react";
import {
  createWalkers,
  drawScene,
  fitCamera,
  hitFloor,
  stepWalkers,
  type Camera,
  type DrawModel,
  type Floater,
  type Walker,
} from "@/game/draw-mall";
import { money } from "@/game/format";

const OPEN_SECONDS = 4.6;
export const OPEN_MS = 4600;
export const OPEN_MS_REDUCED = 800;

export function MallStage({
  model,
  selected,
  playing,
  profit,
  reduced,
  shakeOn,
  onSelect,
  onDone,
}: {
  model: DrawModel;
  selected: number;
  playing: boolean;
  profit: number;
  reduced: boolean;
  shakeOn: boolean;
  onSelect: (index: number) => void;
  onDone: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const fitted = useRef(false);
  const focusRef = useRef(selected);
  const walkers = useRef<Walker[]>([]);
  const floaters = useRef<Floater[]>([]);
  const sizeRef = useRef({ w: 1, h: 1 });
  const elapsed = useRef(0);
  const fired = useRef(false);
  const popped = useRef(false);
  const trauma = useRef(0);
  const playingRef = useRef(playing);
  const modelRef = useRef(model);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  const onDoneRef = useRef(onDone);
  const profitRef = useRef(profit);
  const reducedRef = useRef(reduced);
  const shakeOnRef = useRef(shakeOn);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; moved: boolean; dist: number } | null>(null);
  const pinch = useRef(0);

  playingRef.current = playing;
  modelRef.current = model;
  selectedRef.current = selected;
  onSelectRef.current = onSelect;
  onDoneRef.current = onDone;
  profitRef.current = profit;
  reducedRef.current = reduced;
  shakeOnRef.current = shakeOn;

  const guestKey = (model.guests ?? []).map((guest) => `${guest.seg}:${guest.share}`).join(",");

  useEffect(() => {
    elapsed.current = 0;
    fired.current = false;
    popped.current = false;
    floaters.current = [];
    walkers.current = createWalkers(
      Math.max(1, modelRef.current.floors.length),
      playing,
      modelRef.current.guests ?? [],
    );
    fitted.current = false;
  }, [playing, model.floors.length, model.sign, guestKey]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const w = Math.max(1, wrap.clientWidth);
        const h = Math.max(1, wrap.clientHeight);
        sizeRef.current = { w, h };
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const bw = Math.floor(w * dpr);
        const bh = Math.floor(h * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
        }
        if (!fitted.current || focusRef.current !== selectedRef.current) {
          const floors = Math.max(1, modelRef.current.floors.length);
          const focus = selectedRef.current >= 0 ? selectedRef.current : 0;
          camRef.current = fitCamera(w, h, floors, focus);
          focusRef.current = selectedRef.current;
          fitted.current = true;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          stepWalkers(walkers.current, dt, Math.max(1, modelRef.current.floors.length));
          if (!shakeOnRef.current || reducedRef.current) trauma.current = 0;
          trauma.current = Math.max(0, trauma.current - dt * 1.6);
          const shake = trauma.current * trauma.current;
          const shakeX = Math.sin(now / 38) * 7 * shake;
          const shakeY = Math.cos(now / 31) * 5 * shake;
          if (playingRef.current) {
            elapsed.current += dt;
            const dur = reducedRef.current ? OPEN_MS_REDUCED / 1000 : OPEN_SECONDS;
            if (elapsed.current > 0.4 && floaters.current.length < 7 && Math.random() < dt * 2.2) {
              const floors = Math.max(1, modelRef.current.floors.length);
              floaters.current.push({
                c: 1 + Math.random() * 5,
                r: 1 + Math.random() * 3,
                floor: Math.floor(Math.random() * floors),
                text: "+",
                life: 0.8,
                max: 0.8,
                rise: 0,
                big: false,
              });
            }
            if (!popped.current && elapsed.current > dur * 0.62) {
              popped.current = true;
              const gain = profitRef.current;
              floaters.current.push({
                c: 3.2,
                r: 2,
                floor: Math.max(0, modelRef.current.floors.length - 1),
                text: money(gain, true),
                life: 1.5,
                max: 1.5,
                rise: 0,
                big: true,
              });
              if (gain > 0 && shakeOnRef.current && !reducedRef.current) trauma.current = Math.min(1, trauma.current + 0.7);
            }
            if (!fired.current && elapsed.current >= dur) {
              fired.current = true;
              onDoneRef.current();
            }
          }
          for (const floater of floaters.current) {
            floater.life -= dt;
            floater.rise += dt * 22;
          }
          floaters.current = floaters.current.filter((floater) => floater.life > 0);
          drawScene(ctx, {
            w,
            h,
            cam: camRef.current,
            model: modelRef.current,
            selected: selectedRef.current,
            walkers: walkers.current,
            floaters: floaters.current,
            time: now / 1000,
            shakeX,
            shakeY,
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const cam = camRef.current;
      const factor = event.deltaY > 0 ? 0.92 : 1.08;
      cam.zoom = Math.max(0.45, Math.min(3.6, cam.zoom * factor));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  function zoomBy(factor: number) {
    const cam = camRef.current;
    cam.zoom = Math.max(0.45, Math.min(3.6, cam.zoom * factor));
  }

  function refit() {
    const { w, h } = sizeRef.current;
    const floors = Math.max(1, modelRef.current.floors.length);
    const focus = selectedRef.current >= 0 ? selectedRef.current : 0;
    camRef.current = fitCamera(w, h, floors, focus);
  }

  return (
    <div className="stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="mall-canvas"
        aria-label="商場立體圖，可拖曳與雙指縮放"
        onPointerDown={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          drag.current = { x: event.clientX, y: event.clientY, moved: false, dist: 0 };
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size >= 2) {
            const pts = [...pointers.current.values()];
            const a = pts[0];
            const b = pts[1];
            if (!a || !b) return;
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinch.current > 0) zoomBy(dist / pinch.current);
            pinch.current = dist;
            return;
          }
          pinch.current = 0;
          const current = drag.current;
          if (!current) return;
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          current.dist += Math.hypot(dx, dy);
          if (current.dist > 6) current.moved = true;
          camRef.current.x += dx / camRef.current.zoom;
          camRef.current.y += dy / camRef.current.zoom;
          current.x = event.clientX;
          current.y = event.clientY;
        }}
        onPointerUp={(event) => {
          const current = drag.current;
          pointers.current.delete(event.pointerId);
          if (pointers.current.size < 2) pinch.current = 0;
          drag.current = null;
          if (!current || current.moved) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const hit = hitFloor(
            event.clientX - rect.left,
            event.clientY - rect.top,
            camRef.current,
            sizeRef.current.w,
            sizeRef.current.h,
            modelRef.current.floors.length,
          );
          if (hit != null) onSelectRef.current(hit);
        }}
        onPointerCancel={(event) => {
          pointers.current.delete(event.pointerId);
          drag.current = null;
          pinch.current = 0;
        }}
      />
      <div className="zoom-tools">
        <button type="button" onClick={() => zoomBy(1.12)} aria-label="放大">
          +
        </button>
        <button type="button" onClick={() => zoomBy(0.9)} aria-label="縮小">
          −
        </button>
        <button type="button" onClick={refit} aria-label="回到全景">
          全
        </button>
      </div>
    </div>
  );
}
