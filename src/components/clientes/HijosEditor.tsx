"use client";
/* ============================================================
   HijosEditor — los hijos del cliente
   ------------------------------------------------------------
   «¿Tiene hijos?» Sí / No y, si los tiene, una fila por hijo con
   nombre, fecha de nacimiento (se muestra la edad) y género. El
   número de hijos sale solo de la lista. Sirve para campañas:
   cumpleaños de los niños, Día del Niño, vuelta al cole…
============================================================ */
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./HijosEditor.module.css";

export interface Hijo {
  nombre: string;
  fechaNacimiento?: string;
  genero?: string;
}

function edad(fecha?: string) {
  if (!fecha) return null;
  const n = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(n.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
  return e >= 0 ? e : null;
}

export default function HijosEditor({
  tiene,
  onTiene,
  hijos,
  onChange,
}: {
  /** null = sin contestar */
  tiene: boolean | null;
  onTiene: (v: boolean) => void;
  hijos: Hijo[];
  onChange: (h: Hijo[]) => void;
}) {
  const { t } = useI18n();
  const cambiar = (i: number, campo: keyof Hijo, valor: string) =>
    onChange(hijos.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)));
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.caja}>
      <div className={styles.pregunta}>
        <span>{t("clientes.tieneHijos")}</span>
        <div className={styles.siNo} role="radiogroup" aria-label={t("clientes.tieneHijos")}>
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={tiene === v}
              className={`${styles.opcion} ${tiene === v ? styles.opcionOn : ""}`}
              onClick={() => {
                onTiene(v);
                if (v && hijos.length === 0) onChange([{ nombre: "" }]);
              }}
            >
              {v ? t("common.yes") : t("common.no")}
            </button>
          ))}
        </div>
      </div>

      {tiene && (
        <>
          {hijos.map((h, i) => {
            const anos = edad(h.fechaNacimiento);
            return (
              <div key={i} className={styles.hijo}>
                <span className={styles.num}>{i + 1}</span>
                <label className={styles.campo}>
                  <span>{t("clientes.hijoNombre")}</span>
                  <input value={h.nombre} maxLength={80} placeholder={t("clientes.hijoNombrePh")}
                    onChange={(e) => cambiar(i, "nombre", e.target.value)} />
                </label>
                <label className={styles.campo}>
                  <span>
                    {t("clientes.hijoNacimiento")}
                    {anos != null && <em className={styles.edad}> · {t("clientes.hijoEdad", { n: anos })}</em>}
                  </span>
                  <input type="date" max={hoy} value={h.fechaNacimiento ?? ""}
                    onChange={(e) => cambiar(i, "fechaNacimiento", e.target.value)} />
                </label>
                <label className={styles.campo}>
                  <span>{t("clientes.hijoGenero")}</span>
                  <select value={h.genero ?? ""} onChange={(e) => cambiar(i, "genero", e.target.value)}>
                    <option value="">{t("clientes.genderUnspecified")}</option>
                    <option value="female">{t("clientes.hijoNina")}</option>
                    <option value="male">{t("clientes.hijoNino")}</option>
                    <option value="other">{t("clientes.hijoOtro")}</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.quitar}
                  aria-label={t("clientes.hijoQuitar", { n: i + 1 })}
                  onClick={() => onChange(hijos.filter((_, j) => j !== i))}
                >
                  <Icon name="trash" />
                </button>
              </div>
            );
          })}
          {hijos.length < 20 && (
            <button type="button" className={styles.anadir} onClick={() => onChange([...hijos, { nombre: "" }])}>
              <Icon name="plus" /> {t("clientes.hijoAnadir")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Lista que se envía al backend: solo los hijos con nombre. */
export const hijosParaEnviar = (tiene: boolean | null, hijos: Hijo[]) =>
  tiene === false
    ? []
    : hijos
        .map((h) => ({
          nombre: h.nombre.trim(),
          ...(h.fechaNacimiento && { fechaNacimiento: h.fechaNacimiento }),
          ...(h.genero && { genero: h.genero }),
        }))
        .filter((h) => h.nombre);
