"use client";
/* ============================================================
   Estadísticas · gráficos
   ------------------------------------------------------------
   Todo es SVG y CSS a mano, sin librería de charts: el panel ya
   tiene su paleta en variables y una dependencia como recharts
   pesaría más que estas doscientas líneas.

   Regla común a todos: si no hay datos, se pinta el hueco vacío
   en vez de dividir por cero, y los textos de los ejes van en HTML
   (no dentro del SVG) para que no se deformen al estirar el ancho.
============================================================ */
import styles from "./estadisticas.module.css";

/** Máximo de una serie, nunca cero (evita divisiones infinitas). */
function tope(ns: number[]): number {
  return Math.max(1, ...ns);
}

/** Puntos de una polilínea en el espacio 0-100 × 0-100 del viewBox. */
function puntos(valores: number[], max: number): string {
  if (valores.length === 0) return "";
  const paso = valores.length > 1 ? 100 / (valores.length - 1) : 0;
  return valores.map((v, i) => `${(i * paso).toFixed(2)},${(100 - (v / max) * 100).toFixed(2)}`).join(" ");
}

/* ── Mini gráfica de las tarjetas KPI ───────────────────── */
export function Sparkline({ valores, color }: { valores: number[]; color: string }) {
  if (!valores.length) return <div className={styles.spark} />;
  /* Se escala entre el mínimo y el máximo de la propia serie: con base cero,
     una valoración que va de 4,3 a 4,7 saldría como una raya plana. */
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const pts = valores
    .map((v, i) => {
      const x = valores.length > 1 ? (i * 100) / (valores.length - 1) : 0;
      const y = 92 - ((v - min) / rango) * 84;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg className={styles.spark} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── Líneas comparadas (periodo actual vs anterior) ─────── */
export function LineasComparadas({
  actual,
  previo,
  etiquetas,
  formatoEje,
}: {
  actual: number[];
  previo: number[];
  etiquetas: string[];
  formatoEje: (n: number) => string;
}) {
  const max = tope([...actual, ...previo]);
  /* Cuatro divisiones: los valores del eje salen redondos y la rejilla
     coincide con las etiquetas de la izquierda. */
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(max * f));

  return (
    <div className={styles.lineWrap}>
      <div className={styles.ejeY}>
        {ticks.map((v, i) => (
          <span key={i} className={styles.ejeYItem}>{formatoEje(v)}</span>
        ))}
      </div>
      <div className={styles.lienzoCol}>
        <svg className={styles.lienzo} viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
          <defs>
            <linearGradient id="areaActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--teal-500)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--teal-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} className={styles.rejilla} vectorEffect="non-scaling-stroke" />
          ))}
          {actual.length > 0 && (
            <>
              <polygon points={`0,100 ${puntos(actual, max)} 100,100`} fill="url(#areaActual)" />
              <polyline
                points={puntos(actual, max)}
                fill="none"
                stroke="var(--teal-500)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          {previo.length > 0 && (
            <polyline
              points={puntos(previo, max)}
              fill="none"
              stroke="var(--slate-300)"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <div className={styles.ejeX}>
          {etiquetas.map((e, i) => (
            <span key={`${e}-${i}`} className={styles.ejeXItem}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Donut con leyenda ──────────────────────────────────── */
export interface Segmento {
  nombre: string;
  valor: number;
  color: string;
}

export function Donut({
  segmentos,
  total,
  etiqueta,
  formatoValor,
}: {
  segmentos: Segmento[];
  total: number;
  etiqueta: string;
  formatoValor?: (n: number) => string;
}) {
  const suma = segmentos.reduce((a, s) => a + s.valor, 0) || 1;
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  let acumulado = 0;
  const fmt = formatoValor ?? ((n: number) => n.toLocaleString("es-ES"));

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donutGrafico}>
        <svg viewBox="0 0 140 140" role="img">
          <circle cx="70" cy="70" r={R} className={styles.donutBase} />
          {segmentos.map((s) => {
            const largo = (s.valor / suma) * CIRC;
            const dash = `${largo} ${CIRC - largo}`;
            const offset = CIRC * 0.25 - acumulado;
            acumulado += largo;
            return (
              <circle
                key={s.nombre}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={dash}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className={styles.donutCentro}>
          <span className={styles.donutTotal}>{fmt(total)}</span>
          <span className={styles.donutLabel}>{etiqueta}</span>
        </div>
      </div>
      <div className={styles.donutLeyenda}>
        {segmentos.map((s) => (
          <div key={s.nombre} className={styles.dlFila}>
            <span className={styles.dlPunto} style={{ background: s.color }} />
            <span className={styles.dlNombre}>{s.nombre}</span>
            <span className={styles.dlValor}>{fmt(s.valor)}</span>
            <span className={styles.dlPct}>{((s.valor / suma) * 100).toFixed(1).replace(".", ",")}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Barras agrupadas: actual vs periodo anterior ───────── */
export function BarrasAgrupadas({
  datos,
  etiquetas,
  formatoValor,
}: {
  datos: { actual: number; previo: number }[];
  etiquetas: string[];
  formatoValor: (n: number) => string;
}) {
  const max = tope(datos.flatMap((d) => [d.actual, d.previo]));
  return (
    <div className={`${styles.barras} ${styles.barrasMeses}`}>
      {datos.map((d, i) => (
        <div key={i} className={styles.barraCol}>
          <div className={styles.barraGrupo}>
            <span
              className={styles.barra}
              style={{ height: `${(d.actual / max) * 100}%` }}
              data-val={formatoValor(d.actual)}
            />
            <span
              className={`${styles.barra} ${styles.barraPrev}`}
              style={{ height: `${(d.previo / max) * 100}%` }}
              data-val={formatoValor(d.previo)}
            />
          </div>
          <span className={styles.barraLabel}>{etiquetas[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Barras apiladas por día de la semana ───────────────── */
export interface SerieApilada {
  clave: string;
  nombre: string;
  color: string;
}

export function BarrasApiladas({
  datos,
  series,
  etiquetas,
}: {
  datos: Record<string, number>[];
  series: SerieApilada[];
  etiquetas: string[];
}) {
  const totales = datos.map((d) => series.reduce((a, s) => a + (d[s.clave] || 0), 0));
  const max = tope(totales);
  return (
    <div className={styles.barras}>
      {datos.map((d, i) => (
        <div key={i} className={styles.barraCol}>
          <div className={styles.apilada} style={{ height: `${(totales[i] / max) * 100}%` }}>
            {series.map((s) => {
              const v = d[s.clave] || 0;
              if (!v) return null;
              return (
                <span
                  key={s.clave}
                  className={styles.seg}
                  style={{ height: `${(v / (totales[i] || 1)) * 100}%`, background: s.color }}
                  title={`${s.nombre}: ${v}`}
                />
              );
            })}
          </div>
          <span className={styles.barraLabel}>{etiquetas[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mapa de calor de franjas horarias ──────────────────── */
export function MapaCalor({
  filas,
  columnas,
  valores,
  textoMas,
  textoMenos,
}: {
  filas: string[];
  columnas: string[];
  valores: number[][];
  textoMas: string;
  textoMenos: string;
}) {
  const max = tope(valores.flat());
  return (
    <div className={styles.heat}>
      <div className={styles.heatTabla}>
        <div className={styles.heatCabecera}>
          <span className={styles.heatEsquina} />
          {columnas.map((c) => (
            <span key={c} className={styles.heatCol}>{c}</span>
          ))}
        </div>
        {filas.map((f, i) => (
          <div key={f} className={styles.heatFila}>
            <span className={styles.heatLabel}>{f}</span>
            {columnas.map((c, j) => {
              const v = valores[i]?.[j] ?? 0;
              /* Opacidad mínima para que las celdas vacías sigan formando rejilla. */
              const intensidad = 0.08 + (v / max) * 0.92;
              return (
                <span
                  key={`${f}-${c}`}
                  className={styles.heatCelda}
                  style={{ background: `color-mix(in srgb, var(--teal-500) ${Math.round(intensidad * 100)}%, transparent)` }}
                  title={`${f} · ${c}: ${v}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.heatEscala}>
        <span className={styles.escalaTexto}>{textoMenos}</span>
        <span className={styles.escalaBarra} />
        <span className={styles.escalaTexto}>{textoMas}</span>
      </div>
    </div>
  );
}

/* ── Ranking con posición y barra proporcional ──────────── */
export function RankingLista({
  filas,
  colores,
  formatoValor,
}: {
  filas: { nombre: string; valor: number }[];
  colores: string[];
  formatoValor?: (n: number) => string;
}) {
  const total = filas.reduce((a, f) => a + f.valor, 0) || 1;
  const max = tope(filas.map((f) => f.valor));
  const fmt = formatoValor ?? ((n: number) => n.toLocaleString("es-ES"));
  return (
    <div className={styles.rank}>
      {filas.map((f, i) => (
        <div key={`${f.nombre}-${i}`} className={styles.rankFila}>
          <span className={styles.rankPos}>{i + 1}</span>
          <div className={styles.rankCuerpo}>
            <div className={styles.rankTop}>
              <span className={styles.rankNombre}>{f.nombre}</span>
              <span className={styles.rankValor}>{fmt(f.valor)}</span>
              <span className={styles.rankPct}>{((f.valor / total) * 100).toFixed(1).replace(".", ",")}%</span>
            </div>
            <div className={styles.rankTrack}>
              <span
                className={styles.rankFill}
                style={{ width: `${(f.valor / max) * 100}%`, background: colores[i % colores.length] }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Barras horizontales (distribución por sede) ────────── */
export function BarrasHorizontales({
  filas,
  colores,
}: {
  filas: { nombre: string; valor: number }[];
  colores: string[];
}) {
  const total = filas.reduce((a, f) => a + f.valor, 0) || 1;
  const max = tope(filas.map((f) => f.valor));
  return (
    <div className={styles.hbar}>
      {filas.map((f, i) => (
        <div key={`${f.nombre}-${i}`} className={styles.hbarFila}>
          <span className={styles.hbarNombre}>{f.nombre}</span>
          <span className={styles.hbarTrack}>
            <span
              className={styles.hbarFill}
              style={{ width: `${(f.valor / max) * 100}%`, background: colores[i % colores.length] }}
            />
          </span>
          <span className={styles.hbarValor}>{f.valor.toLocaleString("es-ES")}</span>
          <span className={styles.hbarPct}>{((f.valor / total) * 100).toFixed(1).replace(".", ",")}%</span>
        </div>
      ))}
    </div>
  );
}

/* ── Embudo de conversión ───────────────────────────────── */
export function Embudo({
  pasos,
}: {
  pasos: { nombre: string; valor: number; icono: React.ReactNode }[];
}) {
  const base = pasos[0]?.valor || 1;
  return (
    <div className={styles.embudo}>
      {pasos.map((p, i) => (
        <div key={p.nombre} className={styles.pasoWrap}>
          <div className={styles.paso}>
            <span className={styles.pasoIcono}>{p.icono}</span>
            <span className={styles.pasoNombre}>{p.nombre}</span>
            <span className={styles.pasoValor}>{p.valor.toLocaleString("es-ES")}</span>
            <span className={styles.pasoPct}>{((p.valor / base) * 100).toFixed(1).replace(".", ",")}%</span>
          </div>
          {i < pasos.length - 1 && <span className={styles.flecha} aria-hidden="true">→</span>}
        </div>
      ))}
    </div>
  );
}
