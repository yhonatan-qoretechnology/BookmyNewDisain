"use client";
/* ============================================================
   LoginStoreSky — fondo animado del acceso de la tienda (/login-qore)
   ------------------------------------------------------------
   El inventario como una estantería en 3D (3 baldas de 3 × 3
   productos; cada barra es su stock) y, alrededor, el anillo de
   citas del día (franjas de 15 min, abierto de 09:00 a 20:00).
   Pedidos, stock bajo, reposiciones y citas nuevas salen como
   avisos que siguen a su producto o a su cita mientras todo gira.
   · busy(true) mientras se comprueba la sesión: gira más rápido.
   · celebrate() al entrar: la estantería se llena y el día se
     completa.
   Los colores se leen de las variables CSS del contenedor, así
   que sigue al tema claro/oscuro. Respeta «reducir movimiento».
   Es solo decoración: no toca la lógica del login.
============================================================ */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface LoginStoreSkyHandle {
  busy: (on: boolean) => void;
  celebrate: () => void;
}

export interface TextosTienda {
  haComprado: string;
  haPedidoCita: string;
  unidad: (producto: string) => string;
  unidades: (producto: string, n: number) => string;
  citaA: (servicio: string, hora: string) => string;
  stockBajo: string;
  stockBajoLinea: (producto: string, n: number) => string;
  repuesto: string;
  repuestoLinea: (producto: string, n: number) => string;
  productos: string[];
  servicios: string[];
}

interface Props {
  temaRef: React.RefObject<HTMLElement>;
  tarjetaRef: React.RefObject<HTMLElement>;
  stageRef: React.RefObject<HTMLDivElement>;
  /** Cambia al cambiar de tema, para releer los colores */
  tema: string;
  textos: TextosTienda;
  pedidosHoy: string;
  citasHoy: string;
  clases: {
    sky: string; hud: string; hudItem: string; hudDot: string; hudDotOrders: string; hudDotAppts: string; hudSep: string; tick: string;
    chips: string; chip: string; chipLeft: string; chipTop: string; chipLow: string; chipRestock: string; chipOrder: string; chipAppt: string;
    chipCard: string; chipAv: string; chipTxt: string; chipL1: string; chipL2: string; isIn: string; isOut: string;
  };
}

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
type RGB = [number, number, number];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;
const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k) | 0, lerp(a[1], b[1], k) | 0, lerp(a[2], b[2], k) | 0];
const pick = <T,>(list: T[]) => list[(Math.random() * list.length) | 0];

const PEOPLE = ["Laura Gómez", "Andrés Pardo", "Marta Ruiz", "Sofía León", "Diego Molina", "Valentina Cruz", "Javier Torres", "Camila Rojas", "Lucía Navarro", "Mateo Herrera", "Paula Ortiz", "Hugo Sánchez", "Elena Vidal", "Tomás Rincón"];
const SVG_NS = "http://www.w3.org/2000/svg";
const ICONS: Record<"box" | "alert", string[]> = {
  box: ["M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z", "M4.3 7.7L12 12l7.7-4.3M12 12v8.6"],
  alert: ["M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z", "M12 9.5v4", "M12 17v.1"],
};

const LoginStoreSky = forwardRef<LoginStoreSkyHandle, Props>(function LoginStoreSky(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLElement>(null);
  const apptsRef = useRef<HTMLElement>(null);
  const vivo = useRef(props);
  vivo.current = props;
  const api = useRef<{ busy: (on: boolean) => void; celebrate: () => void; repaint: () => void } | null>(null);

  useImperativeHandle(ref, () => ({
    busy: (on) => api.current?.busy(on),
    celebrate: () => api.current?.celebrate(),
  }));

  useEffect(() => { api.current?.repaint(); }, [props.tema]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = props.stageRef.current;
    const chipsEl = chipsRef.current;
    const ordersEl = ordersRef.current;
    const apptsEl = apptsRef.current;
    if (!canvas || !stage || !chipsEl || !ordersEl || !apptsEl) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const C = vivo.current.clases;
    const T = () => vivo.current.textos;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let REDUCE = motionQuery.matches;
    const onMotion = (e: MediaQueryListEvent) => { REDUCE = e.matches; };
    motionQuery.addEventListener?.("change", onMotion);

    const SLOTS = 96, OPEN_A = 36, OPEN_B = 80;
    const LAYERS = 3, GRID = 3;

    /* Contorno de una balda: cuadrado redondeado en coordenadas unitarias */
    const RC = 0.22;
    const SHAPE: [number, number][] = [];
    ([[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]] as const).forEach(([sx, sz, q]) => {
      for (let n = 0; n <= 6; n++) {
        const th = (q + n / 6) * Math.PI / 2;
        SHAPE.push([sx * (1 - RC) + RC * Math.cos(th), sz * (1 - RC) + RC * Math.sin(th)]);
      }
    });

    type Cell = { k: number; ux: number; uz: number; prod: number; stock: number; target: number; base: number; flash: number; fillAt: number; busy: boolean; tx: number; ty: number; bx: number; by: number; bz: number; bs: number; i: number; j: number };
    type Pt = { x: number; y: number; s: number; z: number };
    type Chip = { el: HTMLDivElement; side: number; onTop: boolean; anchor: () => Pt; cell?: Cell; appt?: Appt; w: number; h: number; born: number; leaving: number; px: number; py: number; ex: number; ey: number };
    type Appt = { s: number; len: number; born: number; dying: number; chip: Chip | null; counted: boolean; seeded?: boolean; fill?: boolean };
    type Ripple = { kind: "ring" | "cell" | "center"; i?: number; c?: Cell; born: number; max: number; life: number; key: "fresh" | "low" | "arc"; alpha: number; w: number };
    type Ev = { kind: "order" | "low" | "restock" | "appt"; side: number; cell?: Cell; appt?: Appt; anchor: () => Pt; av?: string; icon?: "box" | "alert"; strong: string; rest: string; line2: string };

    const cells: Cell[] = [];
    const byLayer: Cell[][] = [];
    for (let k = 0; k < LAYERS; k++) {
      byLayer.push([]);
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const base = rand(0.35, 0.95);
          const c: Cell = { k, ux: (i - 1) * 0.6, uz: (j - 1) * 0.6, prod: (k * 9 + i * GRID + j) % 16, stock: 0, target: base, base, flash: -1e9, fillAt: 0, busy: false, tx: 0, ty: 0, bx: 0, by: 0, bz: 0, bs: 1, i, j };
          cells.push(c);
          byLayer[k].push(c);
        }
      }
    }
    const occ: (Appt | null)[] = new Array(SLOTS).fill(null);
    const apptList: Appt[] = [];
    const ripples: Ripple[] = [];
    const packets: { c: Cell; born: number }[] = [];
    const stars: { x: number; y: number; z: number; tw: number; tint: boolean }[] = [];
    const chips: Chip[] = [];

    const K_DARK = { star: [0.1, 0.45], neb: [0.34, 0.24, 0.12], blob: [0.24, 0.18], planeFill: 0.07, planeLine: 0.6, slot: 0.3, dot: 0.34, dotClosed: 0.09, ringLine: 0.1, tick: [0.5, 0.22], arc: [0.35, 0.65], bar: [0.55, 0.45], fresh: 0.3, hand: 0.9, conn: 0.5, packet: 1 };
    const K_LIGHT = { star: [0.05, 0.2], neb: [0.5, 0.32, 0.26], blob: [0.55, 0.5], planeFill: 0.09, planeLine: 0.5, slot: 0.28, dot: 0.3, dotClosed: 0.1, ringLine: 0.14, tick: [0.45, 0.2], arc: [0.45, 0.55], bar: [0.6, 0.4], fresh: 0.3, hand: 0.85, conn: 0.5, packet: 0.9 };
    let K = K_DARK;
    const P0: RGB = [124, 92, 255];
    let PAL = { dark: true, bg: "#08070e", ink: [238, 237, 248] as RGB, plane: P0, bar: [96, 140, 255] as RGB, low: [240, 80, 140] as RGB, arc: [150, 120, 255] as RGB, fresh: [228, 222, 255] as RGB, glowA: [76, 52, 200] as RGB, glowB: [200, 40, 110] as RGB, glowC: [60, 100, 255] as RGB, blobA: P0, blobB: [220, 50, 120] as RGB };

    function readPalette() {
      const el = vivo.current.temaRef.current || document.documentElement;
      const cs = getComputedStyle(el);
      const rgb = (name: string, fb: string) => (cs.getPropertyValue(name).trim() || fb).split(",").map(Number) as RGB;
      const dark = document.documentElement.dataset.theme === "dark";
      PAL = {
        dark,
        bg: cs.getPropertyValue("--bg").trim() || "#08070e",
        ink: rgb("--ink-rgb", "238,237,248"),
        plane: rgb("--c-plane-rgb", "124,92,255"),
        bar: rgb("--c-bar-rgb", "96,140,255"),
        low: rgb("--c-low-rgb", "240,80,140"),
        arc: rgb("--c-arc-rgb", "150,120,255"),
        fresh: rgb("--c-fresh-rgb", "228,222,255"),
        glowA: rgb("--c-glow-a-rgb", "76,52,200"),
        glowB: rgb("--c-glow-b-rgb", "200,40,110"),
        glowC: rgb("--c-glow-c-rgb", "60,100,255"),
        blobA: rgb("--c-blob-a-rgb", "124,92,255"),
        blobB: rgb("--c-blob-b-rgb", "220,50,120"),
      };
      K = dark ? K_DARK : K_LIGHT;
    }

    let W = 0, H = 0, R = 120, S = 50, G = 25, BAR = 17, CX = 0, CY = 0, F = 400;
    let SR = { left: 0, top: 0, width: 0, height: 0 };
    let CARD: DOMRect | null = null;
    let cY = 1, sY = 0, cP = 1, sP = 0;
    let BASE_PITCH = 0.52, RING_Y = 0;
    let yaw = 0.78, spinSpeed = 1, spinTarget = 1;
    let mouseX = 0, mouseY = 0, smX = 0, smY = 0;
    let start = 0, last = 0, nextSpawn = 0;
    let mode: "idle" | "celebrate" = "idle";
    let orders = 0, ordersBase = 0, introCounted = false, apptCount = 0;
    const P: Pt = { x: 0, y: 0, s: 1, z: 0 };
    const Q: Pt = { x: 0, y: 0, s: 1, z: 0 };
    let raf = 0;
    const timers: number[] = [];

    function seedStars() {
      const n = Math.round(clamp((W * H) / 9000, 50, 160));
      for (let i = 0; i < n; i++) stars.push({ x: Math.random(), y: Math.random(), z: Math.random(), tw: Math.random() * TAU, tint: Math.random() < 0.3 });
    }
    function place() {
      const r = stage!.getBoundingClientRect();
      SR = r;
      const narrow = r.width < 520;
      CX = r.left + r.width / 2;
      CY = r.top + r.height * (narrow ? 0.42 : 0.44);
      R = Math.max(70, Math.min(r.width * (narrow ? 0.44 : 0.36), r.height * (narrow ? 0.46 : 0.44), 280));
      S = R * 0.46;
      G = S * 0.62;
      BAR = S * 0.36;
      RING_Y = -G - S * 0.15;
      F = R * 3.4;
      BASE_PITCH = narrow ? 0.5 : 0.52;
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

    /* Proyección: giro en el eje vertical, inclinación de cámara y perspectiva */
    function proj(x: number, y: number, z: number, out: Pt) {
      const x1 = x * cY - z * sY;
      const z1 = x * sY + z * cY;
      const y2 = y * cP - z1 * sP;
      const z2 = y * sP + z1 * cP;
      const s = F / (F - z2);
      out.x = CX + x1 * s; out.y = CY - y2 * s; out.s = s; out.z = z2;
      return out;
    }
    const lightOf = (z: number) => clamp(0.6 + 0.5 * (z / R), 0.25, 1);
    const layerY = (k: number) => (k - (LAYERS - 1) / 2) * G;
    const slotAngle = (i: number) => (i / SLOTS) * TAU - Math.PI / 2;
    function ringPt(i: number, out: Pt, scale?: number) {
      const a = slotAngle(i), rr = R * (scale || 1);
      return proj(Math.cos(a) * rr, RING_Y, Math.sin(a) * rr, out);
    }
    function line(x1: number, y1: number, x2: number, y2: number) {
      ctx!.beginPath(); ctx!.moveTo(x1, y1); ctx!.lineTo(x2, y2); ctx!.stroke();
    }

    /* ----- Citas (anillo) ----- */
    function isFree(s: number, len: number) {
      for (let i = s; i < s + len; i++) if (occ[i]) return false;
      return true;
    }
    function occupancy() {
      let n = 0;
      for (let i = OPEN_A; i < OPEN_B; i++) if (occ[i]) n++;
      return n / (OPEN_B - OPEN_A);
    }
    function addAppt(s: number, len: number, born: number, extra: Partial<Appt>) {
      const b: Appt = { s, len, born, dying: 0, chip: null, counted: false, ...extra };
      for (let i = s; i < s + len; i++) occ[i] = b;
      apptList.push(b);
      return b;
    }
    function trimAppts(now: number, force?: boolean) {
      if (!force && occupancy() < 0.72) return;
      let oldest: Appt | null = null;
      for (const b of apptList) if (!b.dying && !b.chip && !b.fill && (!oldest || b.born < oldest.born)) oldest = b;
      if (oldest) oldest.dying = now;
    }

    /* ----- Contadores ----- */
    function bump(el: HTMLElement) {
      if (REDUCE) return;
      el.classList.remove(C.tick);
      void el.offsetWidth;
      el.classList.add(C.tick);
    }
    function setOrders(n: number, anim: boolean) { orders = n; ordersEl!.textContent = String(n); if (anim) bump(ordersEl!); }
    function setAppts(n: number, anim: boolean) { apptCount = n; apptsEl!.textContent = String(n); if (anim) bump(apptsEl!); }

    function seed(now: number) {
      let guard = 0;
      while (occupancy() < 0.34 && guard++ < 300) {
        const len = 2 + ((Math.random() * 3) | 0);
        const s = OPEN_A + ((Math.random() * (OPEN_B - OPEN_A - len + 1)) | 0);
        if (isFree(s, len)) addAppt(s, len, REDUCE ? now : now + rand(1200, 2200), { seeded: true });
      }
      ordersBase = 30 + ((Math.random() * 40) | 0);
      if (REDUCE) {
        cells.forEach((c) => { c.stock = c.target; });
        setOrders(ordersBase, false);
        introCounted = true;
      }
    }

    /* ----- Avisos ----- */
    const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");
    const shortName = (name: string) => { const p = name.split(" "); return p[1] ? `${p[0]} ${p[1][0]}.` : p[0]; };
    const timeOf = (slot: number) => { const m = slot * 15; return `${String((m / 60) | 0).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
    const productOf = (c: Cell) => { const l = T().productos; return l[c.prod % Math.max(1, l.length)] ?? ""; };
    const cellTop = (c: Cell): Pt => ({ x: c.tx, y: c.ty, s: 1, z: 0 });

    /* Producto visible por fuera de la estantería, en el lado contrario al aviso que ya está */
    function pickCell(pred: (c: Cell) => boolean, wantSide: number) {
      let best: { c: Cell; side: number } | null = null, bestScore = -Infinity;
      for (let n = 0; n < 14; n++) {
        const c = cells[(Math.random() * cells.length) | 0];
        if (c.busy || !pred(c)) continue;
        proj(c.ux * S, layerY(c.k) + c.stock * BAR, c.uz * S, Q);
        const side = Q.x >= CX ? 1 : -1;
        let score = Math.abs(Q.x - CX) + (Q.z > 0 ? 40 : 0);
        if (wantSide && side !== wantSide) score -= 1000;
        if (score > bestScore) { bestScore = score; best = { c, side }; }
      }
      return best;
    }

    function orderEvent(now: number, wantSide: number): Ev | null {
      const p = pickCell((c) => c.target > 0.32, wantSide);
      if (!p) return apptEvent(now, wantSide);
      const c = p.c;
      const n = 1 + ((Math.random() * 3) | 0);
      c.target = Math.max(0.06, c.target - 0.05 * n - rand(0.03, 0.08));
      c.flash = now;
      packets.push({ c, born: now });
      setOrders(orders + 1, true);
      const who = pick(PEOPLE);
      return { kind: "order", side: p.side, cell: c, anchor: () => cellTop(c), av: initials(who), strong: shortName(who), rest: T().haComprado, line2: n === 1 ? T().unidad(productOf(c)) : T().unidades(productOf(c), n) };
    }
    function lowEvent(now: number, wantSide: number): Ev | null {
      const p = pickCell((c) => c.target >= 0.28 && c.target <= 0.75, wantSide);
      if (!p) return orderEvent(now, wantSide);
      const c = p.c;
      c.target = rand(0.07, 0.15);
      ripples.push({ kind: "cell", c, born: now, max: S * 0.34, life: 1300, key: "low", alpha: 0.75, w: 1.4 });
      const left = Math.max(1, Math.round(c.target * 30));
      return { kind: "low", side: p.side, cell: c, anchor: () => cellTop(c), icon: "alert", strong: T().stockBajo, rest: "", line2: T().stockBajoLinea(productOf(c), left) };
    }
    function restockEvent(now: number, wantSide: number): Ev | null {
      let p = pickCell((c) => c.target < 0.4, wantSide);
      if (!p) {
        let c: Cell | null = null;
        for (const x of cells) if (!x.busy && (!c || x.target < c.target)) c = x;
        if (!c) return null;
        proj(c.ux * S, layerY(c.k), c.uz * S, Q);
        p = { c, side: Q.x >= CX ? 1 : -1 };
      }
      const c = p.c;
      const add = Math.round(rand(12, 30));
      c.target = rand(0.8, 1);
      c.flash = now;
      ripples.push({ kind: "cell", c, born: now, max: S * 0.34, life: 1300, key: "fresh", alpha: 0.6, w: 1.4 });
      return { kind: "restock", side: p.side, cell: c, anchor: () => cellTop(c), icon: "box", strong: T().repuesto, rest: "", line2: T().repuestoLinea(productOf(c), add) };
    }
    function apptEvent(now: number, wantSide: number): Ev | null {
      let choice: { s: number; len: number; side: number } | null = null;
      for (let tries = 0; tries < 60 && !choice; tries++) {
        const len = 2 + ((Math.random() * 3) | 0);
        const s = OPEN_A + ((Math.random() * (OPEN_B - OPEN_A - len + 1)) | 0);
        if (!isFree(s, len)) continue;
        ringPt(s + len / 2, Q);
        const side = Q.x >= CX ? 1 : -1;
        if (tries < 40 && ((wantSide && side !== wantSide) || Q.z < -R * 0.3)) continue;
        choice = { s, len, side };
      }
      if (!choice) { trimAppts(now, true); return null; }
      trimAppts(now);
      const b = addAppt(choice.s, choice.len, now, {});
      ripples.push({ kind: "ring", i: b.s + b.len / 2, born: now, max: R * 0.18, life: 1300, key: "fresh", alpha: 0.6, w: 1.2 });
      const who = pick(PEOPLE);
      const pt: Pt = { x: 0, y: 0, s: 1, z: 0 };
      const svcs = T().servicios;
      return { kind: "appt", side: choice.side, appt: b, anchor: () => ringPt(b.s + b.len / 2, pt), av: initials(who), strong: shortName(who), rest: T().haPedidoCita, line2: T().citaA(svcs.length ? pick(svcs) : "", timeOf(b.s)) };
    }

    function spawn(now: number) {
      const live = chips.filter((c) => !c.leaving);
      const maxChips = W < 940 ? 1 : 2;
      const wantSide = live.length ? -live[0].side : 0;
      const avg = cells.reduce((sum, c) => sum + c.target, 0) / cells.length;
      const lows = cells.filter((c) => c.target < 0.22).length;
      const r = Math.random();
      let ev: Ev | null;
      if (avg < 0.45 || (lows >= 4 && r < 0.5)) ev = restockEvent(now, wantSide);
      else if (r < 0.42) ev = orderEvent(now, wantSide);
      else if (r < 0.74) ev = apptEvent(now, wantSide);
      else if (r < 0.87) ev = lowEvent(now, wantSide);
      else ev = restockEvent(now, wantSide);
      if (ev && live.length < maxChips) makeChip(ev, now);
    }

    function makeChip(ev: Ev, now: number) {
      const el = document.createElement("div");
      const onTop = SR.width < 520;
      const kindClass = { order: C.chipOrder, low: C.chipLow, restock: C.chipRestock, appt: C.chipAppt }[ev.kind];
      el.className = `${C.chip} ${kindClass} ${onTop ? C.chipTop : ev.side < 0 ? C.chipLeft : ""}`;
      const card = document.createElement("div");
      card.className = C.chipCard;
      const av = document.createElement("span");
      av.className = C.chipAv;
      if (ev.icon) {
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        for (const d of ICONS[ev.icon]) {
          const path = document.createElementNS(SVG_NS, "path");
          path.setAttribute("d", d);
          svg.appendChild(path);
        }
        av.appendChild(svg);
      } else av.textContent = ev.av ?? "";
      const txt = document.createElement("span");
      txt.className = C.chipTxt;
      const l1 = document.createElement("span");
      l1.className = C.chipL1;
      const nb = document.createElement("b");
      nb.textContent = ev.strong;
      l1.append(nb, ev.rest ? ` ${ev.rest}` : "");
      const l2 = document.createElement("span");
      l2.className = C.chipL2;
      l2.textContent = ev.line2;
      txt.append(l1, l2);
      card.append(av, txt);
      el.appendChild(card);
      chipsEl!.appendChild(el);
      const chip: Chip = { el, side: ev.side, onTop, anchor: ev.anchor, cell: ev.cell, appt: ev.appt, w: card.offsetWidth, h: card.offsetHeight, born: now, leaving: 0, px: 0, py: 0, ex: 0, ey: 0 };
      if (ev.cell) ev.cell.busy = true;
      if (ev.appt) ev.appt.chip = chip;
      chips.push(chip);
      placeChip(chip);
      requestAnimationFrame(() => el.classList.add(C.isIn));
      timers.push(window.setTimeout(() => dismissChip(chip), 3800));
    }
    function dismissChip(chip: Chip) {
      if (chip.leaving) return;
      chip.leaving = performance.now();
      chip.el.classList.remove(C.isIn);
      chip.el.classList.add(C.isOut);
      timers.push(window.setTimeout(() => {
        chip.el.remove();
        const i = chips.indexOf(chip);
        if (i >= 0) chips.splice(i, 1);
        if (chip.cell) chip.cell.busy = false;
        if (chip.appt && chip.appt.chip === chip) chip.appt.chip = null;
      }, 480));
    }
    /* El aviso sigue a su producto o a su cita; en móvil sale arriba */
    function placeChip(chip: Chip) {
      const pt = chip.anchor();
      chip.px = pt.x; chip.py = pt.y;
      if (chip.onTop) {
        const l = Math.max(4, (SR.width - chip.w) / 2);
        chip.el.style.transform = `translate3d(${l.toFixed(1)}px,4px,0)`;
        chip.ex = SR.left + l + chip.w / 2;
        chip.ey = SR.top + 4 + chip.h;
        return;
      }
      const ax = pt.x + chip.side * 26;
      let left = (chip.side > 0 ? ax : ax - chip.w) - SR.left;
      let top = pt.y - chip.h / 2 - SR.top;
      left = clamp(left, 4, Math.max(4, SR.width - chip.w - 4));
      top = clamp(top, 4, Math.max(4, SR.height - chip.h - 52));
      chip.el.style.transform = `translate3d(${left.toFixed(1)}px,${top.toFixed(1)}px,0)`;
      chip.ex = SR.left + (chip.side > 0 ? left : left + chip.w);
      chip.ey = SR.top + top + chip.h / 2;
    }
    function drawConnector(chip: Chip, now: number) {
      let a = clamp((now - chip.born - 150) / 300, 0, 1);
      if (chip.leaving) a *= 1 - clamp((now - chip.leaving) / 300, 0, 1);
      if (a <= 0) return;
      ctx!.strokeStyle = rgba(PAL.arc, K.conn * a);
      ctx!.lineWidth = 1;
      line(chip.px, chip.py, chip.ex, chip.ey);
      ctx!.fillStyle = rgba(PAL.arc, 0.85 * a);
      ctx!.beginPath();
      ctx!.arc(chip.ex, chip.ey, 2, 0, TAU);
      ctx!.fill();
    }

    /* ----- Dibujo ----- */
    function glowAt(x: number, y: number, r: number, c: RGB, al: number) {
      if (al <= 0 || r <= 0) return;
      const g = ctx!.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(c, al));
      g.addColorStop(1, rgba(c, 0));
      ctx!.fillStyle = g;
      ctx!.fillRect(x - r, y - r, r * 2, r * 2);
    }
    /* Nebulosa: índigo arriba, magenta abajo y azul detrás del objeto */
    function drawNebula(now: number, age: number) {
      const a = clamp(age / 1400, 0, 1);
      const m = Math.max(W, H);
      const tt = REDUCE ? 0 : now * 0.00008;
      glowAt(W * (0.14 + 0.03 * Math.sin(tt)), H * 0.04, m * 0.75, PAL.glowA, K.neb[0] * a);
      glowAt(W * (0.24 + 0.04 * Math.cos(tt * 0.8)), H * 1.04, m * 0.52, PAL.glowB, K.neb[1] * a);
      glowAt(CX, CY, R * 1.7, PAL.glowC, K.neb[2] * a);
    }
    /* Manchas de color detrás de la tarjeta: el cristal las difumina */
    function drawBlobs(now: number, age: number) {
      if (!CARD || !CARD.width) return;
      const a = clamp(age / 1600, 0, 1);
      const tt = REDUCE ? 0 : now * 0.00012;
      const w = CARD.width, h = CARD.height, m = Math.max(w, h);
      glowAt(CARD.left + w * (0.16 + 0.07 * Math.sin(tt * 1.3)), CARD.top + h * (0.2 + 0.06 * Math.cos(tt)), m * 0.56, PAL.blobA, K.blob[0] * a);
      glowAt(CARD.left + w * (0.95 + 0.05 * Math.cos(tt * 0.9)), CARD.top + h * (0.82 + 0.06 * Math.sin(tt * 1.1)), m * 0.5, PAL.blobB, K.blob[1] * a);
      glowAt(CARD.left + w * (0.55 + 0.1 * Math.sin(tt * 0.7 + 2)), CARD.top + h * (0.52 + 0.1 * Math.cos(tt * 0.8 + 1)), m * 0.3, PAL.blobA, K.blob[0] * 0.7 * a);
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
    /* Anillo de citas, en dos pasadas: detrás y delante de la estantería */
    function drawRing(front: boolean, now: number, age: number) {
      const a = easeOut(clamp((age - 200) / 1000, 0, 1));
      if (a <= 0) return;
      ctx!.strokeStyle = rgba(PAL.ink, K.ringLine * a);
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      let pen = false;
      for (let n = 0; n <= 120; n++) {
        const q = (n / 120) * TAU;
        proj(Math.cos(q) * R * 1.06, RING_Y, Math.sin(q) * R * 1.06, Q);
        if ((Q.z >= 0) === front) {
          if (pen) ctx!.lineTo(Q.x, Q.y); else { ctx!.moveTo(Q.x, Q.y); pen = true; }
        } else pen = false;
      }
      ctx!.stroke();
      for (let h = 0; h < 24; h++) {
        const major = h % 6 === 0;
        const ang = slotAngle(h * 4);
        const c = Math.cos(ang), s = Math.sin(ang);
        const outer = major ? 1.17 : 1.14;
        proj(c * R * 1.11, RING_Y, s * R * 1.11, P);
        if ((P.z >= 0) !== front) continue;
        proj(c * R * outer, RING_Y, s * R * outer, Q);
        const L = lightOf(P.z);
        ctx!.strokeStyle = rgba(PAL.ink, (major ? K.tick[0] : K.tick[1]) * L * a);
        ctx!.lineWidth = major ? 1.4 : 1;
        line(P.x, P.y, Q.x, Q.y);
      }
      for (let i = 0; i < SLOTS; i++) {
        const ap = easeOut(clamp((age - 300 - (i / SLOTS) * 900) / 450, 0, 1));
        if (ap <= 0) continue;
        const b = occ[i];
        if (b && now >= b.born && !(b.dying && now - b.dying > 600)) continue;
        ringPt(i + 0.5, P);
        if ((P.z >= 0) !== front) continue;
        const L = lightOf(P.z);
        const open = i >= OPEN_A && i < OPEN_B;
        ctx!.fillStyle = rgba(PAL.ink, (open ? K.dot : K.dotClosed) * L * ap);
        ctx!.beginPath();
        ctx!.arc(P.x, P.y, 1.8 * P.s * (open ? 1 : 0.75), 0, TAU);
        ctx!.fill();
      }
      ctx!.lineCap = "round";
      for (const b of apptList) {
        if (now < b.born) continue;
        ringPt(b.s + b.len / 2, Q);
        if ((Q.z >= 0) !== front) continue;
        const life = now - b.born;
        let fade = REDUCE ? 1 : clamp(life / 260, 0, 1);
        if (b.dying) fade *= 1 - clamp((now - b.dying) / 900, 0, 1);
        if (fade <= 0) continue;
        const fresh = REDUCE ? 0 : 1 - clamp(life / 1700, 0, 1);
        const col = mix(PAL.arc, PAL.fresh, fresh);
        const L = lightOf(Q.z);
        const steps = b.len * 3;
        const s0 = b.s + 0.2, s1 = b.s + b.len - 0.2;
        ctx!.beginPath();
        for (let n = 0; n <= steps; n++) {
          ringPt(lerp(s0, s1, n / steps), P);
          if (n) ctx!.lineTo(P.x, P.y); else ctx!.moveTo(P.x, P.y);
        }
        const lw = 3.6 * Q.s;
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
      /* Aguja con la hora real */
      const ha = easeOut(clamp((age - 900) / 700, 0, 1));
      if (ha > 0) {
        const d = new Date();
        const i = ((d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60) / 1440) * SLOTS;
        ringPt(i, Q, 1.09);
        if ((Q.z >= 0) === front) {
          ringPt(i, P, 0.9);
          const g = ctx!.createLinearGradient(P.x, P.y, Q.x, Q.y);
          g.addColorStop(0, rgba(PAL.ink, 0));
          g.addColorStop(1, rgba(PAL.ink, K.hand * ha));
          ctx!.strokeStyle = g;
          ctx!.lineWidth = 1.5;
          line(P.x, P.y, Q.x, Q.y);
          const pulse = REDUCE ? 0 : (Math.sin(now * 0.004) + 1) / 2;
          ctx!.fillStyle = rgba(PAL.ink, (0.1 + 0.12 * pulse) * ha);
          ctx!.beginPath();
          ctx!.arc(Q.x, Q.y, 6 + 4 * pulse, 0, TAU);
          ctx!.fill();
          ctx!.fillStyle = rgba(PAL.ink, ha);
          ctx!.beginPath();
          ctx!.arc(Q.x, Q.y, 2.6 * Q.s, 0, TAU);
          ctx!.fill();
        }
      }
    }
    /* Estantería: baldas de abajo arriba; en cada balda, de atrás adelante */
    function drawStack(now: number, age: number) {
      for (let k = 0; k < LAYERS; k++) {
        const e = REDUCE ? 1 : easeOut(clamp((age - 250 - k * 150) / 750, 0, 1));
        if (e <= 0) continue;
        const y = layerY(k) - (1 - e) * S * 0.7;
        ctx!.beginPath();
        SHAPE.forEach(([ux, uz], n) => {
          proj(ux * S, y, uz * S, Q);
          if (n) ctx!.lineTo(Q.x, Q.y); else ctx!.moveTo(Q.x, Q.y);
        });
        ctx!.closePath();
        ctx!.fillStyle = rgba(PAL.plane, K.planeFill * e);
        ctx!.fill();
        ctx!.strokeStyle = rgba(PAL.plane, K.planeLine * e);
        ctx!.lineWidth = 1.2;
        ctx!.stroke();

        const list = byLayer[k];
        for (const c of list) {
          proj(c.ux * S, y, c.uz * S, Q);
          c.bx = Q.x; c.by = Q.y; c.bz = Q.z; c.bs = Q.s;
        }
        list.sort((p, q) => p.bz - q.bz);
        ctx!.lineCap = "round";
        for (const c of list) {
          const L = lightOf(c.bz);
          ctx!.fillStyle = rgba(PAL.ink, K.slot * 0.5 * L * e);
          ctx!.beginPath();
          ctx!.arc(c.bx, c.by, 1.3 * c.bs, 0, TAU);
          ctx!.fill();
          const h = c.stock * BAR * e;
          proj(c.ux * S, y + h, c.uz * S, P);
          c.tx = P.x; c.ty = P.y;
          if (h < 0.6) continue;
          const low = clamp((0.26 - c.stock) / 0.12, 0, 1);
          const fl = REDUCE ? 0 : 1 - clamp((now - c.flash) / 1400, 0, 1);
          let col = mix(PAL.bar, PAL.low, low);
          if (fl > 0) col = mix(col, PAL.fresh, fl);
          const w = Math.max(2, S * 0.075 * c.bs);
          if (fl > 0) {
            ctx!.globalCompositeOperation = PAL.dark ? "lighter" : "source-over";
            ctx!.strokeStyle = rgba(col, K.fresh * fl * e);
            ctx!.lineWidth = w + 9 * fl;
            line(c.bx, c.by, P.x, P.y);
            ctx!.globalCompositeOperation = "source-over";
          }
          ctx!.strokeStyle = rgba(col, (K.bar[0] + K.bar[1] * L) * e);
          ctx!.lineWidth = w;
          line(c.bx, c.by, P.x, P.y);
        }
      }
    }
    function drawRipples(now: number) {
      for (let j = ripples.length - 1; j >= 0; j--) {
        const rp = ripples[j];
        const tt = (now - rp.born) / rp.life;
        if (tt >= 1) { ripples.splice(j, 1); continue; }
        if (tt < 0) continue;
        const rad = rp.max * easeOut(tt);
        let cx0 = 0, cz0 = 0, y0 = RING_Y;
        if (rp.kind === "ring") {
          const a = slotAngle(rp.i ?? 0);
          cx0 = Math.cos(a) * R; cz0 = Math.sin(a) * R;
        } else if (rp.kind === "cell" && rp.c) {
          cx0 = rp.c.ux * S; cz0 = rp.c.uz * S; y0 = layerY(rp.c.k);
        }
        ctx!.beginPath();
        for (let n = 0; n <= 40; n++) {
          const q = (n / 40) * TAU;
          proj(cx0 + Math.cos(q) * rad, y0, cz0 + Math.sin(q) * rad, Q);
          if (n) ctx!.lineTo(Q.x, Q.y); else ctx!.moveTo(Q.x, Q.y);
        }
        ctx!.strokeStyle = rgba(PAL[rp.key], rp.alpha * (1 - tt));
        ctx!.lineWidth = rp.w;
        ctx!.stroke();
      }
    }
    /* Cada pedido sale de su producto como un paquete que sube */
    function drawPackets(now: number) {
      for (let j = packets.length - 1; j >= 0; j--) {
        const pk = packets[j];
        const tt = (now - pk.born) / 1300;
        if (tt >= 1) { packets.splice(j, 1); continue; }
        const c = pk.c;
        const y0 = layerY(c.k) + c.stock * BAR;
        proj(c.ux * S, y0, c.uz * S, P);
        proj(c.ux * S, y0 + easeOut(tt) * S * 1.15, c.uz * S, Q);
        const a = (1 - tt * tt) * K.packet;
        const g = ctx!.createLinearGradient(P.x, P.y, Q.x, Q.y);
        g.addColorStop(0, rgba(PAL.fresh, 0));
        g.addColorStop(1, rgba(PAL.fresh, 0.8 * a));
        ctx!.strokeStyle = g;
        ctx!.lineWidth = 1.5;
        line(P.x, P.y, Q.x, Q.y);
        const sz = 3.4 * Q.s;
        ctx!.fillStyle = rgba(PAL.fresh, a);
        ctx!.beginPath();
        ctx!.moveTo(Q.x, Q.y - sz);
        ctx!.lineTo(Q.x + sz, Q.y);
        ctx!.lineTo(Q.x, Q.y + sz);
        ctx!.lineTo(Q.x - sz, Q.y);
        ctx!.closePath();
        ctx!.fill();
      }
    }

    function draw(now: number) {
      const dt = Math.min(64, Math.max(0, now - last) || 16);
      last = now;
      const age = REDUCE ? 1e6 : now - start;
      smX = lerp(smX, mouseX, 0.045);
      smY = lerp(smY, mouseY, 0.045);
      spinSpeed = lerp(spinSpeed, spinTarget, 0.04);
      if (!REDUCE) yaw += dt * 0.00009 * spinSpeed;
      const wob = REDUCE ? 0 : 1;
      const yy = yaw + smX * 0.35 + Math.sin(now * 0.00017) * 0.04 * wob;
      const pp = BASE_PITCH + smY * 0.08 + Math.sin(now * 0.00023) * 0.025 * wob;
      cY = Math.cos(yy); sY = Math.sin(yy);
      cP = Math.cos(pp); sP = Math.sin(pp);

      /* Stock: cada barra se acerca a su nivel objetivo */
      const ease = 1 - Math.pow(1 - 0.06, dt / 16);
      for (const c of cells) {
        if (c.fillAt && now >= c.fillAt) { c.target = 1; c.flash = now; c.fillAt = 0; }
        c.stock = REDUCE ? c.target : c.stock + (c.target - c.stock) * ease;
      }

      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = PAL.bg;
      ctx!.fillRect(0, 0, W, H);
      drawNebula(now, age);
      drawBlobs(now, age);
      drawStars(now, dt, age);
      drawRing(false, now, age);
      drawStack(now, age);
      drawRing(true, now, age);
      drawRipples(now);
      drawPackets(now);

      if (!introCounted) {
        const v = Math.round(ordersBase * easeOut(clamp((age - 900) / 1400, 0, 1)));
        if (v !== orders) setOrders(v, false);
        if (age > 2400) introCounted = true;
      }
      for (const b of apptList) {
        if (!b.counted && !b.fill && now >= b.born) { b.counted = true; setAppts(apptCount + 1, !b.seeded); }
      }
      for (const chip of chips) { placeChip(chip); drawConnector(chip, now); }
      for (let j = apptList.length - 1; j >= 0; j--) {
        const b = apptList[j];
        if (b.dying && now - b.dying > 900) {
          for (let i = b.s; i < b.s + b.len; i++) if (occ[i] === b) occ[i] = null;
          apptList.splice(j, 1);
        }
      }
      if (mode === "idle" && now >= nextSpawn) {
        spawn(now);
        nextSpawn = now + rand(2400, 3600) * (REDUCE ? 1.8 : 1);
      }
    }
    function loop(now: number) { draw(now); raf = requestAnimationFrame(loop); }

    api.current = {
      busy(on) { spinTarget = on ? 7 : 1; },
      celebrate() {
        mode = "celebrate";
        spinTarget = 1.6;
        const now = performance.now();
        chips.slice().forEach(dismissChip);
        cells.forEach((c) => { c.fillAt = now + (REDUCE ? 0 : c.k * 140 + (c.i + c.j) * 35); });
        const d = new Date();
        const nowSlot = (d.getHours() * 60 + d.getMinutes()) / 15;
        for (let i = OPEN_A; i < OPEN_B; i++) {
          if (occ[i]) continue;
          const delay = REDUCE ? 0 : ((((i - nowSlot) % SLOTS) + SLOTS) % SLOTS) / SLOTS * 1300;
          addAppt(i, 1, now + delay, { fill: true });
        }
        if (!REDUCE) ripples.push({ kind: "center", born: now, max: R * 1.9, life: 1800, key: "arc", alpha: 0.6, w: 2 });
      },
      repaint() { readPalette(); draw(performance.now()); },
    };

    readPalette();
    resize();
    start = last = performance.now();
    nextSpawn = start + (REDUCE ? 1500 : 3000);
    seed(start);
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
      <div ref={chipsRef} className={C.chips} />
      <div className={C.hud}>
        <span className={C.hudItem}>
          <i className={`${C.hudDot} ${C.hudDotOrders}`} />
          <b ref={ordersRef as React.RefObject<HTMLElement>}>0</b> <span>{props.pedidosHoy}</span>
        </span>
        <span className={C.hudSep} />
        <span className={C.hudItem}>
          <i className={`${C.hudDot} ${C.hudDotAppts}`} />
          <b ref={apptsRef as React.RefObject<HTMLElement>}>0</b> <span>{props.citasHoy}</span>
        </span>
      </div>
    </>
  );
});

export default LoginStoreSky;
