"use client";
/* ============================================================
   Alta de un negocio desde bookmy.es
   ------------------------------------------------------------
   Sustituye al modal que solo pedía datos para que alguien
   llamara: aquí se crea la cuenta de verdad (empresa, primera
   sede y usuario) y se entra al panel sin pasar por nadie.

   Tres pasos, con el resumen del plan siempre a la vista: es
   donde se vende la prueba de 30 días de Pro, incluso a quien
   llegó buscando el plan gratuito.
============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EmpresasApi } from "@/api/modules";
import { AuthController } from "@/controllers/AuthController";
import { useSession } from "@/context/SessionContext";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { ROUTES } from "@/constants";
import { useWebT } from "./useWebT";
import styles from "./SignupWizard.module.css";

type Plan = "free" | "pro";

interface Datos {
  empresaNombre: string;
  rubro: string;
  telefono: string;
  sedeNombre: string;
  direccion: string;
  municipio: string;
  provincia: string;
  pais: string;
  localidad: string;
  latitud?: number;
  longitud?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acepta: boolean;
}

const VACIO: Datos = {
  empresaNombre: "", rubro: "", telefono: "",
  sedeNombre: "", direccion: "", municipio: "", provincia: "", pais: "", localidad: "",
  firstName: "", lastName: "", email: "", password: "", acepta: false,
};

const RUBROS = ["Salud", "Estetica", "Barberia", "Deporte", "Servicios", "Otro"] as const;
const CLAVE_RUBRO: Record<string, string> = {
  Salud: "rubroSalud", Estetica: "rubroEstetica", Barberia: "rubroBarberia",
  Deporte: "rubroDeporte", Servicios: "rubroServicios", Otro: "rubroOtro",
};

/** Misma regla que valida el backend (password.decorator.ts). */
const PASSWORD_OK = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Primer componente de la dirección cuyo `types` coincida. */
function componente(comps: google.maps.places.AddressComponent[] | undefined, ...tipos: string[]) {
  return comps?.find((c) => tipos.some((t) => c.types.includes(t)))?.long_name ?? "";
}

export default function SignupWizard() {
  const { w, locale } = useWebT();
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useSession();
  const { ready: mapsListo } = useGoogleMaps();

  const [plan, setPlan] = useState<Plan>(params.get("plan") === "free" ? "free" : "pro");
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const direccionRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Datos>(campo: K, valor: Datos[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  /* Google Places rellena municipio, provincia y coordenadas; si no hay
     mapas, los campos siguen ahí para escribirlos a mano. */
  useEffect(() => {
    if (!mapsListo || paso !== 2 || !direccionRef.current) return;
    const auto = new google.maps.places.Autocomplete(direccionRef.current, {
      types: ["address"],
      fields: ["address_components", "formatted_address", "geometry"],
    });
    const sub = auto.addListener("place_changed", () => {
      const place = auto.getPlace();
      const comps = place.address_components;
      setDatos((d) => ({
        ...d,
        direccion: place.formatted_address ?? d.direccion,
        pais: componente(comps, "country"),
        provincia: componente(comps, "administrative_area_level_2", "administrative_area_level_1"),
        municipio: componente(comps, "locality", "postal_town"),
        localidad: componente(comps, "sublocality", "sublocality_level_1", "neighborhood"),
        latitud: place.geometry?.location?.lat(),
        longitud: place.geometry?.location?.lng(),
      }));
    });
    return () => sub.remove();
  }, [mapsListo, paso]);

  const validar = (n: number): string | null => {
    if (n === 1) {
      if (!datos.empresaNombre.trim()) return w("signup.errorNombre");
      if (datos.telefono.trim().length < 6) return w("signup.errorTelefono");
    }
    if (n === 2) {
      if (!datos.sedeNombre.trim()) return w("signup.errorSede");
      if (!datos.direccion.trim()) return w("signup.errorDireccion");
    }
    if (n === 3) {
      if (!datos.firstName.trim() || !datos.lastName.trim()) return w("signup.errorPersona");
      if (!EMAIL_OK.test(datos.email.trim())) return w("signup.errorEmail");
      if (!PASSWORD_OK.test(datos.password)) return w("signup.errorPassword");
      if (!datos.acepta) return w("signup.errorAcepta");
    }
    return null;
  };

  const siguiente = () => {
    const fallo = validar(paso);
    if (fallo) { setError(fallo); return; }
    setError(null);
    setPaso((p) => Math.min(3, p + 1));
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const fallo = validar(3);
    if (fallo) { setError(fallo); return; }
    setEnviando(true);
    setError(null);
    try {
      const res = await EmpresasApi.registrar({
        empresaNombre: datos.empresaNombre.trim(),
        telefono: datos.telefono.trim(),
        rubro: datos.rubro || undefined,
        sedeNombre: datos.sedeNombre.trim(),
        direccion: datos.direccion.trim(),
        pais: datos.pais || undefined,
        provincia: datos.provincia || undefined,
        municipio: datos.municipio || undefined,
        localidad: datos.localidad || undefined,
        latitud: datos.latitud,
        longitud: datos.longitud,
        firstName: datos.firstName.trim(),
        lastName: datos.lastName.trim(),
        email: datos.email.trim().toLowerCase(),
        password: datos.password,
        idioma: locale,
        plan,
        acepta: true,
      });
      if (!res?.token || !res.user) throw new Error(w("signup.errorGeneral"));

      /* La cuenta ya existe y el backend devolvió la sesión: se entra con
         las mismas credenciales para que el panel arranque con su plan y
         los nombres de empresa y sede resueltos. */
      setListo(true);
      const { session } = await AuthController.login(datos.email.trim().toLowerCase(), datos.password);
      if (session) login(session);
      router.push(ROUTES.dashboard);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : w("signup.errorGeneral"));
      setEnviando(false);
      setListo(false);
    }
  };

  const ventajas = useMemo(
    () => (plan === "pro"
      ? ["pricing.pro.f1", "pricing.pro.f2", "pricing.pro.f3", "pricing.pro.f4", "pricing.pro.f6", "pricing.pro.f7"]
      : ["pricing.free.f1", "pricing.free.f2", "pricing.free.f3", "pricing.free.f4", "pricing.free.f5"]),
    [plan]
  );

  if (listo) {
    return (
      <div className={styles.exito}>
        <div className={styles.exitoCheck}>
          <svg viewBox="0 0 52 52" width="56" height="56" aria-hidden>
            <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M15 27l7 7 16-16" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>{w("signup.exitoTitulo")}</h2>
        <p>{w("signup.exitoTexto")}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {/* ── Formulario ─────────────────────────────────── */}
      <form className={styles.form} onSubmit={enviar} noValidate>
        <ol className={styles.pasos}>
          {[1, 2, 3].map((n) => (
            <li key={n} className={`${styles.paso} ${paso === n ? styles.pasoActivo : ""} ${paso > n ? styles.pasoHecho : ""}`}>
              <span className={styles.pasoNum}>
                {paso > n ? (
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : n}
              </span>
              <span className={styles.pasoLabel}>{w(`signup.step${n}`)}</span>
            </li>
          ))}
        </ol>

        {error && (
          <p className={styles.error} role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5.5M12 16.2v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {error}
          </p>
        )}

        {paso === 1 && (
          <div className={styles.campos}>
            <label className={styles.campo}>
              <span>{w("signup.empresaNombre")}</span>
              <input
                value={datos.empresaNombre}
                onChange={(e) => set("empresaNombre", e.target.value)}
                placeholder={w("signup.empresaNombrePh")}
                autoFocus
                autoComplete="organization"
              />
            </label>
            <label className={styles.campo}>
              <span>{w("signup.rubro")}</span>
              <select value={datos.rubro} onChange={(e) => set("rubro", e.target.value)}>
                <option value="">{w("signup.rubroPh")}</option>
                {RUBROS.map((r) => (
                  <option key={r} value={r}>{w(`signup.${CLAVE_RUBRO[r]}`)}</option>
                ))}
              </select>
            </label>
            <label className={styles.campo}>
              <span>{w("signup.telefono")}</span>
              <input
                type="tel"
                value={datos.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder={w("signup.telefonoPh")}
                autoComplete="tel"
              />
            </label>
          </div>
        )}

        {paso === 2 && (
          <div className={styles.campos}>
            <label className={styles.campo}>
              <span>{w("signup.sedeNombre")}</span>
              <input
                value={datos.sedeNombre}
                onChange={(e) => set("sedeNombre", e.target.value)}
                placeholder={w("signup.sedeNombrePh")}
                autoFocus
              />
            </label>
            <label className={styles.campo}>
              <span>{w("signup.direccion")}</span>
              <input
                ref={direccionRef}
                value={datos.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                placeholder={w("signup.direccionPh")}
                autoComplete="off"
              />
              <small>{w("signup.direccionAyuda")}</small>
            </label>
            <div className={styles.fila}>
              <label className={styles.campo}>
                <span>{w("signup.municipio")}</span>
                <input value={datos.municipio} onChange={(e) => set("municipio", e.target.value)} />
              </label>
              <label className={styles.campo}>
                <span>{w("signup.provincia")}</span>
                <input value={datos.provincia} onChange={(e) => set("provincia", e.target.value)} />
              </label>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className={styles.campos}>
            <div className={styles.fila}>
              <label className={styles.campo}>
                <span>{w("signup.firstName")}</span>
                <input value={datos.firstName} onChange={(e) => set("firstName", e.target.value)} autoFocus autoComplete="given-name" />
              </label>
              <label className={styles.campo}>
                <span>{w("signup.lastName")}</span>
                <input value={datos.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" />
              </label>
            </div>
            <label className={styles.campo}>
              <span>{w("signup.email")}</span>
              <input
                type="email"
                value={datos.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder={w("signup.emailPh")}
                autoComplete="email"
              />
              <small>{w("signup.emailAyuda")}</small>
            </label>
            <label className={styles.campo}>
              <span>{w("signup.password")}</span>
              <span className={styles.passWrap}>
                <input
                  type={verPass ? "text" : "password"}
                  value={datos.password}
                  onChange={(e) => set("password", e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setVerPass((v) => !v)} aria-pressed={verPass} aria-label={w("signup.password")}>
                  {verPass ? (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M10.6 10.7a2 2 0 0 0 2.8 2.8" stroke="currentColor" strokeWidth="1.7" /><path d="M6.5 6.8C4.6 8 3.2 9.8 2.5 12c1.6 4 5.2 6.4 9.5 6.4 1.6 0 3.1-.35 4.4-.98M17.8 16A11 11 0 0 0 21.5 12C19.9 8 16.3 5.6 12 5.6c-.8 0-1.6.08-2.3.24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden><path d="M2.5 12C4.1 8 7.7 5.6 12 5.6S19.9 8 21.5 12c-1.6 4-5.2 6.4-9.5 6.4S4.1 16 2.5 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" /></svg>
                  )}
                </button>
              </span>
              <small>{w("signup.passwordAyuda")}</small>
            </label>
            <label className={styles.acepta}>
              <input type="checkbox" checked={datos.acepta} onChange={(e) => set("acepta", e.target.checked)} />
              <span>
                {w("signup.acepta")
                  .split(/\{terminos\}|\{privacidad\}/)
                  .map((trozo, i) => (
                    <span key={i}>
                      {trozo}
                      {i === 0 && <Link href="/cookies">{w("signup.aceptaTerminos")}</Link>}
                      {i === 1 && <Link href="/privacidad">{w("signup.aceptaPrivacidad")}</Link>}
                    </span>
                  ))}
              </span>
            </label>
          </div>
        )}

        <div className={styles.acciones}>
          {paso > 1 && (
            <button type="button" className={styles.secundario} onClick={() => { setError(null); setPaso((p) => p - 1); }}>
              {w("signup.prev")}
            </button>
          )}
          {paso < 3 ? (
            <button type="button" className={styles.principal} onClick={siguiente}>
              {w("signup.next")}
            </button>
          ) : (
            <button type="submit" className={styles.principal} disabled={enviando}>
              {enviando ? (
                <><span className={styles.spinner} aria-hidden />{w("signup.submitting")}</>
              ) : w("signup.submit")}
            </button>
          )}
          <span className={styles.pasoDe}>{w("signup.stepOf", { n: paso })}</span>
        </div>
      </form>

      {/* ── Resumen del plan: aquí se vende ─────────────── */}
      <aside className={styles.resumen}>
        <div className={styles.resumenCard}>
          <span className={styles.resumenEyebrow}>{w("signup.resumenTitulo")}</span>

          <div className={`${styles.planCard} ${plan === "pro" ? styles.planPro : ""}`}>
            <div className={styles.planHead}>
              <strong>{plan === "pro" ? w("signup.planPro") : w("signup.planFree")}</strong>
              <span>{plan === "pro" ? w("signup.planProSub") : w("signup.planFreeSub")}</span>
            </div>
            {plan === "pro" && <span className={styles.planBadge}>30 días</span>}
          </div>

          <p className={styles.incluye}>
            {plan === "pro" ? w("signup.incluyePro") : w("signup.incluyeFree")}
          </p>
          <ul className={styles.ventajas}>
            {ventajas.map((clave) => (
              <li key={clave}>
                <span className={styles.check} aria-hidden>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                {w(clave)}
              </li>
            ))}
          </ul>

          {/* El empujón: a quien eligió Free se le ofrece la prueba; a quien
              ya eligió Pro se le deja salida para no perderlo. */}
          {plan === "free" ? (
            <div className={styles.nudge}>
              <strong>{w("signup.nudgeTitle")}</strong>
              <p>{w("signup.nudgeText")}</p>
              <button type="button" onClick={() => setPlan("pro")}>{w("signup.nudgeCta")}</button>
            </div>
          ) : (
            <button type="button" className={styles.cambiar} onClick={() => setPlan("free")}>
              {w("signup.cambiarAFree")}
            </button>
          )}

          <p className={styles.garantia}>{w("signup.garantia")}</p>
        </div>
      </aside>
    </div>
  );
}
