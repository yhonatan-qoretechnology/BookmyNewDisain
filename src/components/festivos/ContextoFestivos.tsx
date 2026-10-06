"use client";
/* ============================================================
   ContextoFestivos — de dónde salen los festivos del calendario

   Dos sedes del mismo pueblo ven exactamente los mismos días, y dos
   sedes de pueblos distintos pueden verlos iguales si a ninguna le han
   cargado sus fiestas locales. En las dos situaciones parece que el
   calendario "no refresca" al cambiar de sede. Esta línea dice qué
   municipio y qué comunidad se están aplicando, así que el cambio se ve
   — y si una sede no tiene municipio, se nota en vez de pasar callada.
============================================================ */
import { useMemo } from "react";
import { useData } from "@/hooks/useData";
import { FestivosApi } from "@/api/modules";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import type { ApiFestivo } from "@/api/types";
import styles from "./ContextoFestivos.module.css";

export default function ContextoFestivos({
  sedeId,
  empresaId,
  festivos,
}: {
  sedeId?: number;
  empresaId?: number;
  /** Los festivos ya cargados, para saber si al municipio le falta cargar los suyos */
  festivos: ApiFestivo[];
}) {
  const { t } = useI18n();

  const { data: contexto } = useData(
    () =>
      sedeId || empresaId
        ? FestivosApi.contexto({ sedeId, empresaId }).catch(() => null)
        : Promise.resolve(null),
    [sedeId, empresaId],
    null,
  );

  /* Municipios a los que no les ha llegado ninguna fiesta local: son los
     que hay que cargar desde «Festivos locales». */
  const sinLocales = useMemo(() => {
    if (!contexto?.municipios.length) return [];
    const conLocal = new Set(
      festivos
        .filter((f) => f.ambito === "LOCAL" && f.municipio)
        .map((f) => sinTildes(f.municipio as string)),
    );
    return contexto.municipios.filter((m) => !conLocal.has(sinTildes(m)));
  }, [contexto, festivos]);

  /* Sedes cuyo municipio salió del campo antiguo `provincia`: ahí es donde
     estaba el error de Marbella, que recibía las fiestas de Málaga capital. */
  const dudosas = (contexto?.sedes ?? []).filter((s) => s.origenMunicipio === "provincia");

  if (!contexto) return null;

  const { municipios, regiones } = contexto;
  const falta = municipios.length === 0;

  return (
    <div className={`${styles.barra} ${falta ? styles.aviso : ""}`}>
      <Icon name="mapPin" width={16} height={16} />
      <span className={styles.texto}>
        {falta
          ? t("calendario.contextoSinMunicipio")
          : municipios.length === 1
            ? t("calendario.contextoMunicipio", { municipio: municipios[0] })
            : t("calendario.contextoVarios", {
                n: municipios.length,
                municipios: municipios.join(", "),
              })}
        {regiones.length > 0 && (
          <span className={styles.region}>
            {" · "}
            {regiones
              .map((r) => t("calendario.contextoRegion", { region: r }))
              .join(", ")}
            {` (${contexto.pais})`}
          </span>
        )}
      </span>
      {sinLocales.length > 0 && (
        <span className={styles.pendiente}>
          {t("calendario.contextoSinLocales", { municipio: sinLocales.join(", ") })}
        </span>
      )}
      {dudosas.length > 0 && (
        <span className={styles.dudoso}>
          {t("calendario.contextoDudoso", {
            sedes: dudosas.map((s) => s.nombre.trim()).join(", "),
          })}
        </span>
      )}
    </div>
  );
}

/** "Benalmádena" y "Benalmadena" son el mismo pueblo (igual que en el backend) */
function sinTildes(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
