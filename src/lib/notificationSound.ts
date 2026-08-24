/* ============================================================
   notificationSound — beep corto para notificaciones en vivo
   ------------------------------------------------------------
   Sintetizado con Web Audio API (dos tonos cortos tipo "campana"),
   sin depender de ningún archivo de audio externo. Silencioso si
   el navegador bloquea audio sin interacción previa del usuario
   (política estándar de autoplay) — no rompe nada si falla.
============================================================ */
let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

export function playNotificationSound() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    // Dos notas ascendentes cortas — reconocible sin ser molesto.
    tone(ctx, 880, 0, 0.14);
    tone(ctx, 1318.5, 0.12, 0.18);
  } catch {
    /* noop — el audio nunca debe romper la app */
  }
}
