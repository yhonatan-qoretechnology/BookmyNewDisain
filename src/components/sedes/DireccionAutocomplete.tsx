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
============================================================ */
import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useI18n } from "@/i18n";
import { Field } from "@/components/ui/Modal";
import styles from "./DireccionAutocomplete.module.css";

export interface DatosDireccion {
  direccion: string;
  pais: string;
  provincia: string;
  municipio: string;
  localidad: string;
  latitud?: number;
  longitud?: number;
}

/** Primer componente cuyo `types` contenga alguno de los buscados. */
function componente(
  comps: google.maps.places.AddressComponent[] | undefined,
  ...tipos: string[]
): string {
  const c = comps?.find((x) => tipos.some((t) => x.types.includes(t)));
  return c?.long_name ?? "";
}

interface Props {
  valor: DatosDireccion;
  onChange: (d: DatosDireccion) => void;
}

export default function DireccionAutocomplete({ valor, onChange }: Props) {
  const { t } = useI18n();
  const { ready, error } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  /* En una ref para que el listener de Places, que se registra una sola vez,
     no se quede con una versión vieja de la función. */
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!ready || !inputRef.current) return;

    const auto = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["address_components", "formatted_address", "geometry"],
      componentRestrictions: { country: "es" },
    });

    const listener = auto.addListener("place_changed", () => {
      const place = auto.getPlace();
      const comps = place.address_components;
      onChangeRef.current({
        direccion: place.formatted_address ?? inputRef.current?.value ?? "",
        pais: componente(comps, "country"),
        provincia: componente(comps, "administrative_area_level_2", "administrative_area_level_1"),
        municipio: componente(comps, "locality", "postal_town"),
        /* La "localidad" del PDF (Arroyo de la Miel) es una pedanía: Google la
           devuelve como sublocality o como neighborhood según la zona. */
        localidad: componente(comps, "sublocality", "sublocality_level_1", "neighborhood"),
        latitud: place.geometry?.location?.lat(),
        longitud: place.geometry?.location?.lng(),
      });
    });

    return () => listener.remove();
  }, [ready]);

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
        <Field label={t("sedes.provincia")} htmlFor="nsd-prov">
          <input id="nsd-prov" value={valor.provincia} onChange={set("provincia")} />
        </Field>
        <Field label={t("sedes.municipio")} htmlFor="nsd-mun">
          <input id="nsd-mun" value={valor.municipio} onChange={set("municipio")} />
        </Field>
        <Field label={t("sedes.localidad")} htmlFor="nsd-loc">
          <input id="nsd-loc" value={valor.localidad} onChange={set("localidad")} />
        </Field>
      </div>
    </div>
  );
}
