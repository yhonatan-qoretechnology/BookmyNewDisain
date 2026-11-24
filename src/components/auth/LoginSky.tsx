"use client";
/* ============================================================
   LoginSky — fondo animado del acceso al panel
   ------------------------------------------------------------
   La agenda de hoy como un anillo en 3D: 96 franjas de 15 min,
   abierto de 08:00 a 21:00, tres anillos = tres profesionales.
   Las reservas nuevas se encienden y aparece un aviso que sigue
   a su franja. El reloj marca la hora real.
   · busy(true) mientras se comprueba la sesión: gira más rápido.
   · celebrate() al entrar: el día se completa en un barrido.
   Los colores se leen de las variables CSS del contenedor, así
   que sigue al tema claro/oscuro. Respeta «reducir movimiento».
   Es solo decoración: no toca la lógica del login.
============================================================ */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface LoginSkyHandle {
  busy: (on: boolean) => void;
  celebrate: () => void;
}

interface Props {
  /** Elemento del que se leen los colores (--bg, --ink-rgb…) */
  temaRef: React.RefObject<HTMLElement>;
  /** Contenedor de la tarjeta: las manchas de color van detrás */
  tarjetaRef: React.RefObject<HTMLElement>;
  /** Escenario (reloj + avisos) */
  stageRef: React.RefObject<HTMLDivElement>;
  /** Cambia al cambiar de tema, para releer los colores */
  tema: string;
  /** Textos del aviso: «ha reservado» y «{service} a las {time}» */
  verbo: string;
  formatoHora: (servicio: string, hora: string) => string;
  servicios: string[];
  reservasHoy: string;
  clases: { sky: string; clock: string; time: string; colon: string; count: string; tick: string; chips: string; chip: string; chipLeft: string; chipTop: string; chipCard: string; chipAv: string; chipTxt: string; chipL1: string; chipL2: string; isIn: string; isOut: string };
}

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
type RGB = [number, number, number];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;
const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k) | 0, lerp(a[1], b[1], k) | 0, lerp(a[2], b[2], k) | 0];

const PEOPLE = ["Laura Gómez", "Andrés Pardo", "Marta Ruiz", "Sofía León", "Diego Molina", "Valentina Cruz", "Javier Torres", "Camila Rojas", "Lucía Navarro", "Mateo Herrera", "Paula Ortiz", "Hugo Sánchez", "Elena Vidal", "Tomás Rincón"];

const LoginSky = forwardRef<LoginSkyHandle, Props>(function LoginSky(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLElement>(null);
  const hhRef = useRef<HTMLSpanElement>(null);
  const mmRef = useRef<HTMLSpanElement>(null);
  /* Lo último de las props, para el bucle de animación */
  const vivo = useRef(props);
  vivo.current = props;
  const api = useRef<{ busy: (on: boolean) => void; celebrate: () => void; repaint: () => void } | null>(null);

  useImperativeHandle(ref, () => ({
    busy: (on) => api.current?.busy(on),
    celebrate: () => api.current?.celebrate(),
  }));

  /* Cambio de tema: releer colores */
  useEffect(() => { api.current?.repaint(); }, [props.tema]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = props.stageRef.current;
    const chipsEl = chipsRef.current;
    const countEl = countRef.current;
    if (!canvas || !stage || !chipsEl || !countEl) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const C = vivo.current.clases;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let REDUCE = motionQuery.matches;
    const onMotion = (e: MediaQueryListEvent) => { REDUCE = e.matches; };
    motionQuery.addEventListener?.("change", onMotion);
    const FONT = getComputedStyle(document.body).fontFamily;

    const SLOTS = 96, OPEN_A = 32, OPEN_B = 84;
    const RINGS = [{ r: 1, s: 1.8 }, { r: 0.855, s: 1.55 }, { r: 0.71, s: 1.3 }];
    type Chip = { el: HTMLDivElement; side: number; onTop: boolean; line: boolean; w: number; h: number; born: number; leaving: number; px: number; py: number; ex: number; ey: number };
    type Booking = { k: number; s: number; len: number; born: number; dying: number; chip: Chip | null; counted: boolean; seeded?: boolean; fill?: boolean; who?: string; svc?: number };
    type Ripple = { k?: number; i: number; born: number; max: number; life: number; fresh: boolean; alpha: number; w: number; center?: boolean };
    const occ: (Booking | null)[][] = RINGS.map(() => new Array(SLOTS).fill(null));
    const bookings: Booking[] = [];
    const ripples: Ripple[] = [];
    const stars: { x: number; y: number; z: number; tw: number; tint: boolean }[] = [];

    const K_DARK = { star: [0.1, 0.5], dotOpen: 0.34, dotClosed: 0.09, glow: [0.12, 0.04], disc: 0.028, discLine: 0.08, tick: [0.5, 0.22], label: 0.5, arc: [0.3, 0.7], fresh: 0.25, blob: [0.17, 0.4], hand: 0.9, conn: 0.45 };
    const K_LIGHT = { star: [0.05, 0.22], dotOpen: 0.3, dotClosed: 0.1, glow: [0.38, 0.12], disc: 0.06, discLine: 0.1, tick: [0.45, 0.2], label: 0.6, arc: [0.45, 0.55], fresh: 0.3, blob: [0.6, 0.7], hand: 0.85, conn: 0.5 };
    let K = K_DARK;
    let PAL = { dark: true, bg: "#0b1009", ink: [238, 243, 226] as RGB, arc: [199, 215, 97] as RGB, fresh: [246, 255, 196] as RGB, glow: [199, 215, 97] as RGB, blobA: [199, 215, 97] as RGB, blobB: [64, 104, 26] as RGB };

    function readPalette() {
      const el = vivo.current.temaRef.current || document.documentElement;
      const cs = getComputedStyle(el);
      const rgb = (name: string, fb: string) => (cs.getPropertyValue(name).trim() || fb).split(",").map(Number) as RGB;
      const dark = document.documentElement.dataset.theme === "dark";
      PAL = {
        dark,
        bg: cs.getPropertyValue("--bg").trim() || "#0b1009",
        ink: rgb("--ink-rgb", "238,243,226"),
        arc: rgb("--arc-rgb", "199,215,97"),
        fresh: rgb("--fresh-rgb", "246,255,196"),
        glow: rgb("--glow-rgb", "199,215,97"),
        blobA: rgb("--blob-a-rgb", "199,215,97"),
        blobB: rgb("--blob-b-rgb", "64,104,26"),
      };
      K = dark ? K_DARK : K_LIGHT;
    }

    let W = 0, H = 0, R = 120, CX = 0, CY = 0, F = 400;
    let SR = { left: 0, top: 0, width: 0, height: 0 };
    let CARD: DOMRect | null = null;
    let cosT = 1, sinT = 0, cosY = 1, sinY = 0;
    let BASE_TILT = 1.02, SHOW_LABELS = true;
    let spin = -0.5, spinSpeed = 1, spinTarget = 1;
    let mouseX = 0, mouseY = 0, smX = 0, smY = 0;
    let start = 0, last = 0, nextSpawn = 0;
    let count = 0, mode: "idle" | "celebrate" = "idle";
    const P = { x: 0, y: 0, s: 1, z: 0 };
    const Q = { x: 0, y: 0, s: 1, z: 0 };
    let raf = 0;
    const timers: number[] = [];

    function seedStars() {
      const n = Math.round(clamp((W * H) / 9000, 50, 160));
      for (let i = 0; i < n; i++) stars.push({ x: Math.random(), y: Math.random(), z: Math.random(), tw: Math.random() * TAU, tint: Math.random() < 0.22 });
    }
    function place() {
      const r = stage!.getBoundingClientRect();
      SR = r;
      CX = r.left + r.width / 2;
      CY = r.top + r.height / 2;
      const narrow = r.width < 520;
      R = Math.max(70, Math.min(r.width * (narrow ? 0.44 : 0.36), r.height * 0.6, 290));
      F = R * 3.4;
      BASE_TILT = narrow ? 0.9 : 1.02;
      SHOW_LABELS = !narrow;
      CARD = vivo.current.tarjetaRef.current?.getBoundingClientRect() ?? null;
    }
    function resize() {
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.round(W * dpr));
      canvas!.height = Math.max(1, Math.round(H * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!stars.length) seedStars();
      place();
    }

    function proj(u: number, v: number, out: typeof P) {
      const y = v * cosT;
      const z0 = -v * sinT;
      const x = u * cosY + z0 * sinY;
      const z = z0 * cosY - u * sinY;
      const s = F / (F + z);
      out.x = CX + x * s; out.y = CY + y * s; out.s = s; out.z = z;
      return out;
    }
    const angleOf = (i: number) => (i / SLOTS) * TAU - Math.PI / 2 + spin;
    function ringPoint(k: number, i: number, out: typeof P, scale?: number) {
      const a = angleOf(i);
      const rr = R * RINGS[k].r * (scale || 1);
      return proj(Math.cos(a) * rr, Math.sin(a) * rr, out);
    }
    const lightOf = (z: number) => clamp(0.62 - 0.5 * (z / R), 0.22, 1);

    function isFree(k: number, s: number, len: number) {
      for (let i = s; i < s + len; i++) if (occ[k][i]) return false;
      return true;
    }
    function occupancy(k: number) {
      let n = 0;
      for (let i = OPEN_A; i < OPEN_B; i++) if (occ[k][i]) n++;
      return n / (OPEN_B - OPEN_A);
    }
    function addBooking(k: number, s: number, len: number, born: number, extra: Partial<Booking>) {
      const b: Booking = { k, s, len, born, dying: 0, chip: null, counted: false, ...extra };
      for (let i = s; i < s + len; i++) occ[k][i] = b;
      bookings.push(b);
      return b;
    }
    function trim(k: number, now: number) {
      if (occupancy(k) < 0.78) return;
      let oldest: Booking | null = null;
      for (const b of bookings) if (b.k === k && !b.dying && !b.chip && !b.fill && (!oldest || b.born < oldest.born)) oldest = b;
      if (oldest) oldest.dying = now;
    }
    function seed(now: number) {
      for (let k = 0; k < RINGS.length; k++) {
        let guard = 0;
        while (occupancy(k) < 0.42 && guard++ < 300) {
          const len = 2 + ((Math.random() * 3) | 0);
          const s = OPEN_A + ((Math.random() * (OPEN_B - OPEN_A - len + 1)) | 0);
          if (isFree(k, s, len)) addBooking(k, s, len, REDUCE ? now : now + rand(1100, 2100), { seeded: true });
        }
      }
    }
    function setCount(n: number, animate: boolean) {
      count = n;
      countEl!.textContent = String(n);
      if (animate && !REDUCE) {
        countEl!.classList.remove(C.tick);
        void countEl!.offsetWidth;
        countEl!.classList.add(C.tick);
      }
    }

    const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");
    const shortName = (name: string) => { const p = name.split(" "); return p[1] ? `${p[0]} ${p[1][0]}.` : p[0]; };
    const timeOf = (slot: number) => { const m = slot * 15; return `${String((m / 60) | 0).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

    function spawn(now: number) {
      const live = bookings.filter((b) => b.chip && !b.chip.leaving);
      const maxChips = W < 940 ? 1 : 2;
      const wantSide = live.length ? -live[0].chip!.side : 0;
      const narrow = SR.width < 520;
      let choice: { k: number; s: number; len: number; side: number; line: boolean } | null = null;
      for (let tries = 0; tries < 60 && !choice; tries++) {
        const k = (Math.random() * RINGS.length) | 0;
        const len = 2 + ((Math.random() * 3) | 0);
        const s = OPEN_A + ((Math.random() * (OPEN_B - OPEN_A - len + 1)) | 0);
        if (!isFree(k, s, len)) continue;
        ringPoint(k, s + len / 2, Q);
        const side = Q.x >= CX ? 1 : -1;
        if (tries < 40 && (narrow ? Q.y > CY - 6 : (wantSide && side !== wantSide) || Q.z > R * 0.3)) continue;
        choice = { k, s, len, side, line: !narrow || Q.y <= CY - 6 };
      }
      if (!choice) { for (let k = 0; k < RINGS.length; k++) trim(k, now); return; }
      trim(choice.k, now);
      const nServ = Math.max(1, vivo.current.servicios.length);
      const b = addBooking(choice.k, choice.s, choice.len, now, { who: PEOPLE[(Math.random() * PEOPLE.length) | 0], svc: (Math.random() * nServ) | 0 });
      if (!REDUCE) ripples.push({ k: b.k, i: b.s + b.len / 2, born: now, max: R * 0.2, life: 1300, fresh: true, alpha: 0.6, w: 1.2 });
      if (live.length < maxChips) makeChip(b, choice.side, choice.line, now);
    }

    function makeChip(b: Booking, side: number, line: boolean, now: number) {
      const el = document.createElement("div");
      const onTop = SR.width < 520;
      el.className = `${C.chip} ${onTop ? C.chipTop : side < 0 ? C.chipLeft : ""}`;
      const card = document.createElement("div");
      card.className = C.chipCard;
      const av = document.createElement("span");
      av.className = C.chipAv;
      av.textContent = initials(b.who!);
      const txt = document.createElement("span");
      txt.className = C.chipTxt;
      const l1 = document.createElement("span");
      l1.className = C.chipL1;
      const nb = document.createElement("b");
      nb.textContent = shortName(b.who!);
      l1.append(nb, ` ${vivo.current.verbo}`);
      const l2 = document.createElement("span");
      l2.className = C.chipL2;
      const serv = vivo.current.servicios[b.svc! % Math.max(1, vivo.current.servicios.length)] ?? "";
      l2.textContent = vivo.current.formatoHora(serv, timeOf(b.s));
      txt.append(l1, l2);
      card.append(av, txt);
      el.appendChild(card);
      chipsEl!.appendChild(el);
      b.chip = { el, side, onTop, line, w: card.offsetWidth, h: card.offsetHeight, born: now, leaving: 0, px: 0, py: 0, ex: 0, ey: 0 };
      placeChip(b);
      requestAnimationFrame(() => el.classList.add(C.isIn));
      timers.push(window.setTimeout(() => dismissChip(b), 3800));
    }
    function dismissChip(b: Booking) {
      const c = b.chip;
      if (!c || c.leaving) return;
      c.leaving = performance.now();
      c.el.classList.remove(C.isIn);
      c.el.classList.add(C.isOut);
      timers.push(window.setTimeout(() => { c.el.remove(); if (b.chip === c) b.chip = null; }, 480));
    }
    function placeChip(b: Booking) {
      const c = b.chip!;
      ringPoint(b.k, b.s + b.len / 2, P);
      c.px = P.x; c.py = P.y;
      if (c.onTop) {
        const l = Math.max(4, (SR.width - c.w) / 2);
        c.el.style.transform = `translate3d(${l.toFixed(1)}px,4px,0)`;
        c.ex = SR.left + l + c.w / 2;
        c.ey = SR.top + 4 + c.h;
        return;
      }
      let dx = P.x - CX;
      let dy = (P.y - CY) * 1.5;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl; dy /= dl;
      const ax = P.x + dx * 22;
      const ay = P.y + dy * 16;
      let left = (c.side > 0 ? ax : ax - c.w) - SR.left;
      let top = ay - c.h / 2 - SR.top;
      left = clamp(left, 4, Math.max(4, SR.width - c.w - 4));
      top = clamp(top, 4, Math.max(4, SR.height - c.h - 4));
      c.el.style.transform = `translate3d(${left.toFixed(1)}px,${top.toFixed(1)}px,0)`;
      c.ex = SR.left + (c.side > 0 ? left : left + c.w);
      c.ey = SR.top + top + c.h / 2;
    }

    function drawBlobs(now: number, age: number) {
      if (!CARD || !CARD.width) return;
      const a = clamp(age / 1600, 0, 1);
      const tt = REDUCE ? 0 : now * 0.00012;
      const w = CARD.width, h = CARD.height, m = Math.max(w, h);
      const list: [number, number, number, RGB, number][] = [
        [CARD.left + w * (0.16 + 0.07 * Math.sin(tt * 1.3)), CARD.top + h * (0.2 + 0.06 * Math.cos(tt)), m * 0.56, PAL.blobA, K.blob[0]],
        [CARD.left + w * (0.95 + 0.05 * Math.cos(tt * 0.9)), CARD.top + h * (0.8 + 0.06 * Math.sin(tt * 1.1)), m * 0.5, PAL.blobB, K.blob[1]],
        [CARD.left + w * (0.55 + 0.1 * Math.sin(tt * 0.7 + 2)), CARD.top + h * (0.52 + 0.1 * Math.cos(tt * 0.8 + 1)), m * 0.3, PAL.blobA, K.blob[0] * 0.7],
      ];
      for (const [x, y, r, c, al] of list) {
        const g = ctx!.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, al * a));
        g.addColorStop(1, rgba(c, 0));
        ctx!.fillStyle = g;
        ctx!.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    function drawStars(now: number, dt: number, age: number) {
      const intro = clamp(age / 1200, 0, 1);
      for (const st of stars) {
        if (!REDUCE) {
          st.y -= (0.000005 + st.z * 0.000012) * dt;
          if (st.y < -0.03) { st.y = 1.03; st.x = Math.random(); }
        }
        const x = st.x * W + smX * st.z * 26;
        const y = st.y * H + smY * st.z * 16;
        const tw = REDUCE ? 1 : 0.65 + 0.35 * Math.sin(now * 0.0015 + st.tw);
        ctx!.fillStyle = rgba(st.tint ? PAL.arc : PAL.ink, (K.star[0] + st.z * K.star[1]) * tw * intro);
        ctx!.beginPath();
        ctx!.arc(x, y, 0.45 + st.z * 1.1, 0, TAU);
        ctx!.fill();
      }
    }
    function drawGlow(age: number) {
      const a = clamp(age / 1500, 0, 1);
      const gy = CY + R * 0.12;
      const g = ctx!.createRadialGradient(CX, gy, 0, CX, gy, R * 1.7);
      g.addColorStop(0, rgba(PAL.glow, K.glow[0] * a));
      g.addColorStop(0.5, rgba(PAL.glow, K.glow[1] * a));
      g.addColorStop(1, rgba(PAL.glow, 0));
      ctx!.fillStyle = g;
      ctx!.fillRect(CX - R * 1.8, gy - R * 1.8, R * 3.6, R * 3.6);
    }
    function drawDial(age: number) {
      const a = easeOut(clamp((age - 150) / 1000, 0, 1));
      if (a <= 0) return;
      ctx!.beginPath();
      for (let n = 0; n <= 120; n++) {
        const q = (n / 120) * TAU;
        proj(Math.cos(q) * R * 1.065, Math.sin(q) * R * 1.065, Q);
        if (n) ctx!.lineTo(Q.x, Q.y); else ctx!.moveTo(Q.x, Q.y);
      }
      ctx!.closePath();
      ctx!.fillStyle = rgba(PAL.glow, K.disc * a);
      ctx!.fill();
      ctx!.strokeStyle = rgba(PAL.ink, K.discLine * a);
      ctx!.lineWidth = 1;
      ctx!.stroke();
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      for (let h = 0; h < 24; h++) {
        const major = h % 6 === 0;
        const ang = angleOf(h * 4);
        const c = Math.cos(ang), s = Math.sin(ang);
        const outer = major ? 1.17 : 1.14;
        proj(c * R * 1.11, s * R * 1.11, P);
        proj(c * R * outer, s * R * outer, Q);
        const L = lightOf(P.z);
        ctx!.strokeStyle = rgba(PAL.ink, (major ? K.tick[0] : K.tick[1]) * L * a);
        ctx!.lineWidth = major ? 1.4 : 1;
        ctx!.beginPath();
        ctx!.moveTo(P.x, P.y);
        ctx!.lineTo(Q.x, Q.y);
        ctx!.stroke();
        if (major && SHOW_LABELS) {
          proj(c * R * 1.27, s * R * 1.27, Q);
          ctx!.font = `500 ${Math.max(10, Math.round(11 * Q.s))}px ${FONT}`;
          ctx!.fillStyle = rgba(PAL.ink, K.label * L * a);
          ctx!.fillText(`${String(h).padStart(2, "0")}:00`, Q.x, Q.y);
        }
      }
    }
    function drawSlots(now: number, age: number) {
      for (let k = 0; k < RINGS.length; k++) {
        const ring = RINGS[k];
        for (let i = 0; i < SLOTS; i++) {
          const ap = easeOut(clamp((age - 250 - (i / SLOTS) * 900 - k * 140) / 450, 0, 1));
          if (ap <= 0) continue;
          const b = occ[k][i];
          if (b && now >= b.born && !(b.dying && now - b.dying > 600)) continue;
          ringPoint(k, i + 0.5, P);
          const L = lightOf(P.z);
          const open = i >= OPEN_A && i < OPEN_B;
          ctx!.fillStyle = rgba(PAL.ink, (open ? K.dotOpen : K.dotClosed) * L * ap);
          ctx!.beginPath();
          ctx!.arc(P.x, P.y, ring.s * P.s * (open ? 1 : 0.75), 0, TAU);
          ctx!.fill();
        }
      }
      ctx!.lineCap = "round";
      for (const b of bookings) {
        if (now < b.born) continue;
        const life = now - b.born;
        let fade = REDUCE ? 1 : clamp(life / 260, 0, 1);
        if (b.dying) fade *= 1 - clamp((now - b.dying) / 900, 0, 1);
        if (fade <= 0) continue;
        const fresh = REDUCE ? 0 : 1 - clamp(life / 1700, 0, 1);
        const col = mix(PAL.arc, PAL.fresh, fresh);
        const ring = RINGS[b.k];
        ringPoint(b.k, b.s + b.len / 2, Q);
        const L = lightOf(Q.z);
        const steps = b.len * 3;
        const s0 = b.s + 0.2, s1 = b.s + b.len - 0.2;
        ctx!.beginPath();
        for (let n = 0; n <= steps; n++) {
          ringPoint(b.k, lerp(s0, s1, n / steps), P);
          if (n) ctx!.lineTo(P.x, P.y); else ctx!.moveTo(P.x, P.y);
        }
        const lw = ring.s * 2.1 * Q.s;
        if (fresh > 0) {
          ctx!.globalCompositeOperation = PAL.dark ? "lighter" : "source-over";
          ctx!.strokeStyle = rgba(col, K.fresh * fresh * fade);
          ctx!.lineWidth = lw + 12 * fresh;
          ctx!.stroke();
          ctx!.globalCompositeOperation = "source-over";
        }
        ctx!.strokeStyle = rgba(col, (K.arc[0] + K.arc[1] * L) * fade);
        ctx!.lineWidth = lw;
        ctx!.stroke();
      }
    }
    function drawRipples(now: number) {
      for (let j = ripples.length - 1; j >= 0; j--) {
        const rp = ripples[j];
        const tt = (now - rp.born) / rp.life;
        if (tt >= 1) { ripples.splice(j, 1); continue; }
        if (tt < 0) continue;
        const rad = rp.max * easeOut(tt);
        let cu = 0, cv = 0;
        if (!rp.center && rp.k != null) {
          const a = angleOf(rp.i), rr = R * RINGS[rp.k].r;
          cu = Math.cos(a) * rr; cv = Math.sin(a) * rr;
        }
        ctx!.beginPath();
        for (let n = 0; n <= 40; n++) {
          const q = (n / 40) * TAU;
          proj(cu + Math.cos(q) * rad, cv + Math.sin(q) * rad, Q);
          if (n) ctx!.lineTo(Q.x, Q.y); else ctx!.moveTo(Q.x, Q.y);
        }
        ctx!.strokeStyle = rgba(rp.fresh ? PAL.fresh : PAL.arc, rp.alpha * (1 - tt));
        ctx!.lineWidth = rp.w;
        ctx!.stroke();
      }
    }
    function drawHand(now: number, age: number) {
      const a = easeOut(clamp((age - 900) / 700, 0, 1));
      if (a <= 0) return;
      const d = new Date();
      const i = ((d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60) / 1440) * SLOTS;
      ringPoint(2, i, P, 0.86);
      ringPoint(0, i, Q, 1.09);
      const g = ctx!.createLinearGradient(P.x, P.y, Q.x, Q.y);
      g.addColorStop(0, rgba(PAL.ink, 0));
      g.addColorStop(1, rgba(PAL.ink, K.hand * a));
      ctx!.strokeStyle = g;
      ctx!.lineWidth = 1.5;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      ctx!.moveTo(P.x, P.y);
      ctx!.lineTo(Q.x, Q.y);
      ctx!.stroke();
      const pulse = REDUCE ? 0 : (Math.sin(now * 0.004) + 1) / 2;
      ctx!.fillStyle = rgba(PAL.ink, (0.1 + 0.12 * pulse) * a);
      ctx!.beginPath();
      ctx!.arc(Q.x, Q.y, 6 + 4 * pulse, 0, TAU);
      ctx!.fill();
      ctx!.fillStyle = rgba(PAL.ink, a);
      ctx!.beginPath();
      ctx!.arc(Q.x, Q.y, 2.6 * Q.s, 0, TAU);
      ctx!.fill();
    }
    function drawConnector(b: Booking, now: number) {
      const c = b.chip!;
      if (!c.line) return;
      let a = clamp((now - c.born - 150) / 300, 0, 1);
      if (c.leaving) a *= 1 - clamp((now - c.leaving) / 300, 0, 1);
      if (a <= 0) return;
      ctx!.strokeStyle = rgba(PAL.arc, K.conn * a);
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(c.px, c.py);
      ctx!.lineTo(c.ex, c.ey);
      ctx!.stroke();
      ctx!.fillStyle = rgba(PAL.arc, 0.85 * a);
      ctx!.beginPath();
      ctx!.arc(c.ex, c.ey, 2, 0, TAU);
      ctx!.fill();
    }

    function draw(now: number) {
      const dt = Math.min(64, Math.max(0, now - last) || 16);
      last = now;
      const age = REDUCE ? 1e6 : now - start;
      smX = lerp(smX, mouseX, 0.045);
      smY = lerp(smY, mouseY, 0.045);
      spinSpeed = lerp(spinSpeed, spinTarget, 0.04);
      if (!REDUCE) spin += dt * 0.00004 * spinSpeed;
      const wob = REDUCE ? 0 : 1;
      const tilt = BASE_TILT + Math.sin(now * 0.00023) * 0.035 * wob + smY * 0.09;
      const yaw = Math.sin(now * 0.00015) * 0.05 * wob + smX * 0.2;
      cosT = Math.cos(tilt); sinT = Math.sin(tilt);
      cosY = Math.cos(yaw); sinY = Math.sin(yaw);

      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = PAL.bg;
      ctx!.fillRect(0, 0, W, H);
      drawBlobs(now, age);
      drawStars(now, dt, age);
      drawGlow(age);
      drawDial(age);
      drawSlots(now, age);
      drawRipples(now);
      drawHand(now, age);
      for (const b of bookings) {
        if (!b.counted && !b.fill && now >= b.born) { b.counted = true; setCount(count + 1, !b.seeded); }
        if (b.chip) { placeChip(b); drawConnector(b, now); }
      }
      for (let j = bookings.length - 1; j >= 0; j--) {
        const b = bookings[j];
        if (b.dying && now - b.dying > 900) {
          for (let i = b.s; i < b.s + b.len; i++) if (occ[b.k][i] === b) occ[b.k][i] = null;
          bookings.splice(j, 1);
        }
      }
      if (mode === "idle" && now >= nextSpawn) {
        spawn(now);
        nextSpawn = now + rand(2400, 3600) * (REDUCE ? 1.8 : 1);
      }
    }
    function loop(now: number) { draw(now); raf = requestAnimationFrame(loop); }

    function tickClock() {
      const d = new Date();
      if (hhRef.current) hhRef.current.textContent = String(d.getHours()).padStart(2, "0");
      if (mmRef.current) mmRef.current.textContent = String(d.getMinutes()).padStart(2, "0");
    }

    api.current = {
      busy(on) { spinTarget = on ? 7 : 1; },
      celebrate() {
        mode = "celebrate";
        spinTarget = 1.6;
        const now = performance.now();
        bookings.forEach((b) => { if (b.chip) dismissChip(b); });
        const d = new Date();
        const nowSlot = (d.getHours() * 60 + d.getMinutes()) / 15;
        for (let k = 0; k < RINGS.length; k++) {
          for (let i = OPEN_A; i < OPEN_B; i++) {
            if (occ[k][i]) continue;
            const delay = REDUCE ? 0 : ((((i - nowSlot) % SLOTS) + SLOTS) % SLOTS) / SLOTS * 1300 + k * 90;
            addBooking(k, i, 1, now + delay, { fill: true });
          }
        }
        if (!REDUCE) ripples.push({ center: true, i: 0, born: now, max: R * 1.9, life: 1800, fresh: false, alpha: 0.65, w: 2 });
      },
      repaint() { readPalette(); draw(performance.now()); },
    };

    readPalette();
    resize();
    start = last = performance.now();
    nextSpawn = start + (REDUCE ? 1500 : 3000);
    seed(start);
    tickClock();
    const reloj = window.setInterval(tickClock, 1000);
    const onResize = () => requestAnimationFrame(resize);
    const onMove = (e: PointerEvent) => {
      if (!W) return;
      mouseX = (e.clientX / W) * 2 - 1;
      mouseY = (e.clientY / H) * 2 - 1;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    const ro = "ResizeObserver" in window ? new ResizeObserver(place) : null;
    ro?.observe(stage);
    const tarjeta = vivo.current.tarjetaRef.current;
    if (tarjeta) ro?.observe(tarjeta);
    tarjeta?.addEventListener("animationend", place);
    document.fonts?.ready.then(place).catch(() => undefined);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(reloj);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", place);
      window.removeEventListener("pointermove", onMove);
      motionQuery.removeEventListener?.("change", onMotion);
      tarjeta?.removeEventListener("animationend", place);
      ro?.disconnect();
      chipsEl.replaceChildren();
      api.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const C = props.clases;
  return (
    <>
      <canvas ref={canvasRef} className={C.sky} aria-hidden="true" />
      <div className={C.clock}>
        <div className={C.time}>
          <span ref={hhRef}>00</span><span className={C.colon}>:</span><span ref={mmRef}>00</span>
        </div>
        <div className={C.count}>
          <b ref={countRef as React.RefObject<HTMLElement>}>0</b> <span>{props.reservasHoy}</span>
        </div>
      </div>
      <div ref={chipsRef} className={C.chips} />
    </>
  );
});

export default LoginSky;
