/* ============================================================
   Skeleton — piezas para armar los loading.tsx de cada ruta
   ------------------------------------------------------------
   Sin hooks ni "use client": los loading.tsx son Server
   Components y se muestran al instante mientras llega la ruta.
   Cada pieza imita a su componente real (Panel, StatGrid,
   DataTable, CardGrid, CalendarGrid…) usando sus mismas clases
   de contenedor, para que al montar la vista no se mueva nada.
============================================================ */
import type { CSSProperties, ReactNode } from "react";
import s from "./Skeleton.module.css";
import panel from "./Panel.module.css";
import stat from "./StatCard.module.css";
import cards from "./Cards.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Primitiva ───────────────────────────────────────────── */
export function Bone({ w = "100%", h = 14, shape, className, style }: {
  w?: number | string;
  h?: number | string;
  shape?: "circle" | "pill";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cx(s.bone, shape && s[shape], className)}
      style={{ width: w, height: h, ...style }}
    />
  );
}

/* ── Raíz: anuncia la carga a lectores de pantalla ───────── */
export function SkeletonPage({ label = "Cargando", children }: { label?: string; children: ReactNode }) {
  return (
    <div className={s.root} role="status" aria-busy="true" aria-live="polite">
      <span className={s.srOnly}>{label}…</span>
      {children}
    </div>
  );
}

/* ── Panel + cabecera ────────────────────────────────────── */
export function SkPanelHead({ actions = 0, sub = true }: { actions?: number; sub?: boolean }) {
  return (
    <div className={s.head}>
      <div className={s.headText}>
        <Bone w={180} h={18} />
        {sub && <Bone w={120} h={12} />}
      </div>
      {actions > 0 && (
        <div className={s.toolbarGroup}>
          {Array.from({ length: actions }, (_, i) => <Bone key={i} w={110} h={38} style={{ borderRadius: "var(--r-md)" }} />)}
        </div>
      )}
    </div>
  );
}

export function SkPanel({ head = true, actions, className, style, children }: {
  head?: boolean;
  actions?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div className={cx(panel.panel, className)} style={style}>
      {head && <SkPanelHead actions={actions} />}
      {children}
    </div>
  );
}

/* ── Toolbar: buscador + filtros + acciones ──────────────── */
export function SkToolbar({ filters = 0, actions = 0 }: { filters?: number; actions?: number }) {
  const control = { borderRadius: "var(--r-md)" };
  return (
    <div className={s.toolbar}>
      <div className={s.toolbarGroup}>
        <Bone w={260} h={40} style={control} />
        {Array.from({ length: filters }, (_, i) => <Bone key={i} w={180} h={40} style={control} />)}
      </div>
      {actions > 0 && (
        <div className={s.toolbarGroup}>
          {Array.from({ length: actions }, (_, i) => <Bone key={i} w={130} h={40} style={control} />)}
        </div>
      )}
    </div>
  );
}

/* ── Tarjetas de estadísticas (ícono flotante) ───────────── */
export function SkStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={stat.statGrid} style={{ marginTop: 12, marginBottom: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={stat.statCard}>
          <Bone w={58} h={58} className={s.statIcon} />
          <div className={s.stat}>
            <Bone w={90} h={12} />
            <Bone w={70} h={28} />
          </div>
          <div className={s.statFooter}><Bone w="60%" h={11} /></div>
        </div>
      ))}
    </div>
  );
}

/* ── Tabla ───────────────────────────────────────────────── */
const ANCHOS = ["70%", "55%", "80%", "45%", "65%", "50%", "75%"];

export function SkTable({ cols = 5, rows = 6, person = 0 }: {
  cols?: number;
  rows?: number;
  /** Índice de la columna con avatar + nombre (PersonRow); -1 para ninguna */
  person?: number;
}) {
  const grid = { "--sk-cols": `repeat(${cols}, minmax(0, 1fr))` } as CSSProperties;
  return (
    <div className={s.table}>
      <div className={cx(s.tr, s.th)} style={grid}>
        {Array.from({ length: cols }, (_, c) => <Bone key={c} w="50%" h={10} />)}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={s.tr} style={grid}>
          {Array.from({ length: cols }, (_, c) =>
            c === person ? (
              <div key={c} className={s.person}>
                <Bone w={34} h={34} shape="circle" />
                <Bone w={ANCHOS[(r + c) % ANCHOS.length]} h={12} />
              </div>
            ) : (
              <Bone key={c} w={ANCHOS[(r + c) % ANCHOS.length]} h={12} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Grilla de tarjetas (sedes, empresas, reseñas…) ──────── */
export function SkCards({ count = 6, image = false, avatar = false }: {
  count?: number;
  image?: boolean;
  avatar?: boolean;
}) {
  return (
    <div className={cards.cardGrid}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cx(cards.simpleCard, s.card)}>
          {image && <Bone h={140} style={{ borderRadius: "var(--r-lg)" }} />}
          {avatar ? (
            <div className={s.person}>
              <Bone w={40} h={40} shape="circle" />
              <div className={cx(s.headText, s.flex1)}>
                <Bone w="60%" h={14} />
                <Bone w="40%" h={10} />
              </div>
            </div>
          ) : (
            <Bone w="65%" h={16} />
          )}
          <Bone w="100%" h={11} />
          <Bone w={ANCHOS[i % ANCHOS.length]} h={11} />
          <div className={s.cardTags}>
            <Bone w={64} h={22} shape="pill" />
            <Bone w={80} h={22} shape="pill" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Calendario mensual ──────────────────────────────────── */
export function SkCalendar() {
  return (
    <div>
      <div className={s.calHead}>
        <Bone w={150} h={18} />
        <div className={s.toolbarGroup}>
          <Bone w={36} h={36} shape="circle" />
          <Bone w={36} h={36} shape="circle" />
        </div>
      </div>
      <div className={s.calGrid}>
        {Array.from({ length: 7 }, (_, i) => <Bone key={`d${i}`} w="40%" h={10} style={{ margin: "0 auto 6px" }} />)}
        {Array.from({ length: 35 }, (_, i) => <Bone key={i} className={s.calCell} h="auto" />)}
      </div>
    </div>
  );
}

/* ── Gráfico de barras ───────────────────────────────────── */
const ALTURAS = ["45%", "70%", "55%", "85%", "40%", "65%", "90%", "60%", "75%", "50%"];

export function SkChart({ bars = 10 }: { bars?: number }) {
  return (
    <div className={s.chart}>
      {Array.from({ length: bars }, (_, i) => <Bone key={i} h={ALTURAS[i % ALTURAS.length]} />)}
    </div>
  );
}

/* ── Formulario: etiqueta + campo ────────────────────────── */
export function SkForm({ fields = 4 }: { fields?: number }) {
  return (
    <div>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className={s.field}>
          <Bone w={110} h={11} />
          <Bone h={42} style={{ borderRadius: "var(--r-md)" }} />
        </div>
      ))}
    </div>
  );
}

/* ── Filas con interruptor (ajustes) ─────────────────────── */
export function SkSwitchRows({ rows = 4 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.row}>
          <Bone w={ANCHOS[i % ANCHOS.length]} h={12} style={{ maxWidth: 260 }} />
          <Bone w={42} h={24} shape="pill" />
        </div>
      ))}
    </div>
  );
}

/* ── Pestañas ────────────────────────────────────────────── */
export function SkTabs({ count = 3 }: { count?: number }) {
  return (
    <div className={s.toolbarGroup} style={{ marginBottom: 20 }}>
      {Array.from({ length: count }, (_, i) => <Bone key={i} w={120} h={38} shape="pill" />)}
    </div>
  );
}

/* ── Pasos del asistente ─────────────────────────────────── */
export function SkSteps({ count = 4 }: { count?: number }) {
  return (
    <div className={s.steps}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ display: "contents" }}>
          <Bone w={32} h={32} shape="circle" />
          {i < count - 1 && <Bone h={3} className={s.stepLine} />}
        </span>
      ))}
    </div>
  );
}

/* ── Chat: canales + conversación ────────────────────────── */
export function SkChat() {
  const burbujas: [boolean, number][] = [[false, 220], [true, 180], [false, 300], [true, 140], [false, 240], [true, 260]];
  return (
    <div className={s.chatWrap}>
      <div className={s.channels}>
        <Bone h={42} style={{ borderRadius: "var(--r-md)", marginBottom: 10 }} />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={s.channelItem}>
            <Bone w={42} h={42} shape="circle" />
            <div className={cx(s.headText, s.flex1)}>
              <Bone w="55%" h={13} />
              <Bone w={ANCHOS[i % ANCHOS.length]} h={10} />
            </div>
          </div>
        ))}
      </div>
      <div className={s.chat}>
        <div className={s.chatHead}>
          <Bone w={42} h={42} shape="circle" />
          <div className={s.headText}>
            <Bone w={160} h={14} />
            <Bone w={100} h={10} />
          </div>
        </div>
        <div className={s.msgs}>
          {burbujas.map(([out, w], i) => (
            <div key={i} className={cx(s.msg, out && s.msgOut)}>
              <Bone w={30} h={30} shape="circle" />
              <Bone w={w} h={44} className={s.bubble} style={{ maxWidth: "70%" }} />
            </div>
          ))}
        </div>
        <div className={s.composer}>
          <Bone h={46} style={{ borderRadius: "var(--r-md)" }} />
        </div>
      </div>
    </div>
  );
}

/* Grillas de página, expuestas para componer layouts */
export const skGrid = { cols2: s.cols2, cols4: s.cols4, sideMain: s.sideMain };
