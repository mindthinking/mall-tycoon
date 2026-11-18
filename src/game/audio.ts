let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.connect(master);
    master.connect(ctx.destination);
    master.gain.value = 0.9;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio(): void {
  ensure();
}

export function bindAudioVisibility(): () => void {
  const onVis = () => {
    if (document.visibilityState === "visible") void ctx?.resume();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => document.removeEventListener("visibilitychange", onVis);
}

export function setMuted(muted: boolean): void {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.02);
}

function beep(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0): void {
  if (!ctx || !sfx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp);
  amp.connect(sfx);
  osc.start(t);
  osc.stop(t + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    amp.disconnect();
  };
}

export function playChime(): void {
  if (!ensure()) return;
  beep(523, 0.12, "sine", 0.05, 0);
  beep(659, 0.14, "sine", 0.04, 0.08);
  beep(784, 0.18, "triangle", 0.035, 0.16);
}

export function playCoin(): void {
  if (!ensure()) return;
  const wobble = 0.96 + Math.random() * 0.08;
  beep(880 * wobble, 0.08, "triangle", 0.05, 0);
  beep(1175 * wobble, 0.1, "sine", 0.04, 0.06);
  beep(1568 * wobble, 0.14, "sine", 0.03, 0.12);
}

export function playTap(): void {
  if (!ensure()) return;
  beep(440, 0.045, "triangle", 0.03, 0);
}

export function playDeny(): void {
  if (!ensure()) return;
  beep(196, 0.12, "triangle", 0.04, 0);
}
