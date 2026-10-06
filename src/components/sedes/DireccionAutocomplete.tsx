"use client";
/* ============================================================
   DireccionAutocomplete — dirección de la sede con Google Places
   ------------------------------------------------------------
   El cliente pidió País / Provincia / Municipio / Localidad. En vez
   de cuatro desplegables encadenados (que obligarían a mantener un
   catálogo de municipios de España), se escribe la dirección y
   Places rellena los cuatro campos solo.

   Los campos quedan editables: Places no siempre acierta con la
   localidad en municipios pequeños, y es preferible poder corregir
   a que el dato se quede mal.

   La búsqueda se limita al país de la empresa, no a España: el país
   se fijó al crear la cuenta y una sede nunca está en otro. Así un
   negocio colombiano ve sus direcciones de Bogotá y uno español no
   ve ruido de medio mundo.
============================================================ */
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useRegion } from "@/context/RegionContext";
import { useI18n } from "@/i18n";
import { Field } from "@/components/ui/Modal";
import { autocompletarDireccion } from "@/lib/places";
import styles from "./DireccionAutocomplete.module.css";

export interface DatosDireccion {
  direccion: string;
  pais: string;
  provincia: string;
  municipio: string;
  localidad: string;
  latitud?: number;
  longitud?: number;
  /* Los rellena Places; opcionales porque el formulario arranca sin
     ellos y no se piden a mano. `paisIso` es el ISO-2 del país y
     `region` la comunidad o departamento con que se sacan los festivos. */
  paisIso?: string;
  region?: string;
}

interface Props {
  valor: DatosDireccion;
  onChange: (d: DatosDireccion) => void;
  /** País en el que buscar (ISO-2). Por defecto, el de la empresa. */
  paisIso?: string;
}

export default function DireccionAutocomplete({ valor, onChange, paisIso }: Props) {
  const { t } = useI18n();
  const { ready, error } = useGoogleMaps();
  const { pais, etiqueta } = useRegion();
  const inputRef = useRef<HTMLInputElement>(null);
  /* En una ref para que el listener de Places, que se registra una sola vez,
     no se quede con una versión vieja de la función. */
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const buscarEn = paisIso ?? pais.isoCode;

  useEffect(() => {
    if (!ready || !inputRef.current) return;
    return autocompletarDireccion(inputRef.current, buscarEn, (direccion) =>
      onChangeRef.current(direccion)
    );
  }, [ready, buscarEn]);

  const set = (campo: keyof DatosDireccion) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...valor, [campo]: e.target.value });

  return (
    <div className={styles.wrap}>
      <Field label={t("sedes.address")} htmlFor="nsd-dir">
        <input
          id="nsd-dir"
          ref={inputRef}
          defaultValue={valor.direccion}
          onChange={set("direccion")}
          placeholder={t("sedes.addressPlaceholder")}
          autoComplete="off"
        />
      </Field>

      {error ? (
        <p className={styles.error}>{t("sedes.mapsError")}</p>
      ) : (
        <p className={styles.aviso}>{ready ? t("sedes.autocompletaAyuda") : t("sedes.cargandoMapas")}</p>
      )}

      <div className={styles.grid}>
        <Field label={t("sedes.pais")} htmlFor="nsd-pais">
          <input id="nsd-pais" value={valor.pais} onChange={set("pais")} />
        </Field>
        <Field label={etiqueta("region")} htmlFor="nsd-prov">
          <input id="nsd-prov" value={valor.provincia} onChange={set("provincia")} />
        </Field>
        <Field label={etiqueta("municipio")} htmlFor="nsd-mun">
          <input id="nsd-mun" value={valor.municipio} onChange={set("municipio")} />
        </Field>
        <Field label={t("sedes.localidad")} htmlFor="nsd-loc">
          <input id="nsd-loc" value={valor.localidad} onChange={set("localidad")} />
        </Field>
      </div>
    </div>
  );
}
