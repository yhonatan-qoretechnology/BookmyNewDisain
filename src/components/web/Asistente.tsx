"use client";
/* ============================================================
   Asistente vendedor de la web pública
   ------------------------------------------------------------
   Puerto de js/assistant.js. El original era un IIFE que se
   inyectaba en el <body> de una página que se recargaba entera;
   aquí la web es una SPA, así que el widget se monta y se
   desmonta muchas veces en la misma pestaña y TODO lo que
   arranca se tiene que poder parar:
     · los setTimeout pasan por programar() y se cancelan todos
       al desmontar (incluidas las esperas del «está escribiendo»,
       que se quedan sin resolver a propósito para que la cadena
       de await no siga tocando el estado),
     · los fetch llevan AbortController y se abortan,
     · los listeners de document se quitan uno a uno,
     · las clases que el widget pone en el <body> (ai-open,
       is-locked) se limpian.

   Lo que dice y lo que decide NO está aquí: vive en
   lib/web/asistente/guion.ts y en los diccionarios
   i18n/dictionaries/web/asistente.es|en.ts. Este archivo es la
   vista y el motor de la conversación.

   Las clases de CSS son las del original (public/web/v2/bookmy.css),
   así que el marcado no se puede «mejorar»: se ve igual porque es
   el mismo árbol.

   Se pinta en un portal sobre el <body> porque el original se
   añadía ahí: si el widget quedara dentro de una sección con
   transform o filter, el position: fixed se agarraría a ella y el
   panel saldría descolocado.
============================================================ */
import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useWebT } from "./useWebT";
import asistenteEn from "@/i18n/dictionaries/web/asistente.en";
import asistenteEs from "@/i18n/dictionaries/web/asistente.es";
import { formatearDinero, pais } from "@/lib/web/money";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import {
  CONFIG_POR_DEFECTO,
  RUTAS_POR_DEFECTO,
  TIPOS_EMPRESA,
  calcularRoi,
  catalogoChips,
  chipsApertura,
  chipsEmpujon,
  chipsRecomendacion,
  cierreRecomendacion,
  detectarIntencion,
  enlaceCorreo,
  enlaceWhatsapp,
  esIntencionGuiada,
  esMensajeTexto,
  estadoVacio,
  extraerPerfil,
  guardarPaso,
  interpretarFlujo,
  introFlujo,
  introRecomendacion,
  normalizar,
  olvidarRoi,
  parsearLinea,
  parsearMarkdown,
  paisDelRoi,
  pasosDelFlujo,
  perfilParaApi,
  recomendarPlan,
  responder,
  respuestaDePaso,
  resumenLead,
  sanearEstado,
  teaserDePagina,
  texto as textoDe,
  tipoPorDefecto,
  type Accion,
  type Chip,
  type ClaveIntencion,
  type ClaveTexto,
  type ConfigAsistente,
  type Contexto,
  type EstadoChat,
  type Lead,
  type Mensaje,
  type NombreFlujo,
  type RutasAsistente,
  type Teaser,
  type Trozo,
  type ValorPaso,
  type Variables,
} from "@/lib/web/asistente/guion";

/* La conversación se guarda con la misma clave que el original para
   que quien ya tuviera una abierta no la pierda. */
const CLAVE = "bookmy_ai";
const CLAVE_TEASER = "bookmy_ai_teaser";

/** API global del original: otras partes de la página abren el asistente con esto. */
interface ApiAsistente {
  open: () => void;
  ask: (texto: string) => void;
  flow: (nombre: string) => void;
  close: () => void;
}

declare global {
  interface Window {
    BookmyAssistant?: ApiAsistente;
  }
}

export interface PropsAsistente {
  /** Clave de la página (el data-page del original): decide la sugerencia flotante y el modo «app para personas». */
  pagina?: string;
  /** API de respuestas con IA. Vacío (de serie) = solo respuestas guionizadas. */
  endpoint?: string;
  /** API que recibe los contactos. Vacío (de serie) = se envían por WhatsApp o correo. */
  leadEndpoint?: string;
  precioBasic?: string;
  precioPro?: string;
  diasPrueba?: number;
  whatsapp?: string;
  email?: string;
  retrasoTeaser?: number;
  rutas?: Partial<RutasAsistente>;
  /** El visitante aceptó las cookies funcionales: la conversación se guarda entre visitas. */
  consentimientoFuncional?: boolean;
}

/* Cómo está el panel, al margen de la conversación. Vive en un ref y no
   en useState porque lo leen funciones asíncronas: con estado se
   quedarían con el valor de hace tres awaits. */
interface Vista {
  abierto: boolean;
  /** La conversación guardada ya se está pintando (el original la pintaba al abrir). */
  restaurado: boolean;
  escribiendo: boolean;
  ocupado: boolean;
  teaser: Teaser | null;
  teaserVisible: boolean;
  punto: boolean;
}

/** Qué abrir además del panel: una pregunta escrita o una acción de chip. */
type Apertura =
  | { tipo: "preguntar"; texto: string }
  | { tipo: "accion"; accion: Accion; etiqueta?: string };

/* ------------------------------------------------------------
   Pintado del texto
   ------------------------------------------------------------
   El original construía HTML y lo inyectaba; aquí se pinta el
   árbol que devuelve el guion, así que React escapa el texto solo
   y no hay dangerouslySetInnerHTML en ningún sitio.
------------------------------------------------------------ */
function Trozos({ trozos }: { trozos: Trozo[] }) {
  return (
    <>
      {trozos.map((t, i) => {
        if (t.tipo === "negrita") return <b key={i}>{t.texto}</b>;
        if (t.tipo === "salto") return <br key={i} />;
        if (t.tipo === "enlace") {
          /* Igual que el original: solo se abre en otra pestaña lo que
             sale de la web (http/https); las rutas internas, no. */
          return t.externo ? (
            <a key={i} href={t.href} target="_blank" rel="noopener">{t.texto}</a>
          ) : (
            <a key={i} href={t.href}>{t.texto}</a>
          );
        }
        return <Fragment key={i}>{t.texto}</Fragment>;
      })}
    </>
  );
}

function Markdown({ texto }: { texto: string }) {
  return (
    <>
      {parsearMarkdown(texto).map((b, i) =>
        b.tipo === "parrafo" ? (
          <p key={i}><Trozos trozos={b.trozos} /></p>
        ) : (
          <ul key={i}>
            {b.puntos.map((punto, j) => <li key={j}><Trozos trozos={punto} /></li>)}
          </ul>
        )
      )}
    </>
  );
}

/** El mensaje del visitante: sin markdown, solo saltos de línea. */
function LineasSueltas({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("\n").map((linea, i) => (
        <Fragment key={i}>{i > 0 && <br />}{linea}</Fragment>
      ))}
    </>
  );
}

/* ------------------------------------------------------------
   Formulario de contacto
   ------------------------------------------------------------
   Es la única tarjeta con estado propio. No se guarda en la
   conversación (el original tampoco la guardaba), así que al
   recargar la página desaparece.
------------------------------------------------------------ */
function FormularioLead({
  ctx,
  prefill,
  onEnviar,
}: {
  ctx: Contexto;
  prefill: { nombre: string; email: string; telefono: string };
  onEnviar: (lead: Lead) => void;
}) {
  const t = (clave: ClaveTexto, extra?: Variables) => textoDe(ctx, clave, extra);
  const uid = useId();
  const [nombre, setNombre] = useState(prefill.nombre);
  const [email, setEmail] = useState(prefill.email);
  const [telefono, setTelefono] = useState(prefill.telefono);
  const [tipo, setTipo] = useState(() => tipoPorDefecto(ctx));
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const lead: Lead = {
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      tipo,
    };
    if (lead.nombre.length < 2) { setError(t("leadErrNombre")); return; }
    /* Vale con uno de los dos, pero alguno tiene que servir para contestar. */
    if (!/^\S+@\S+\.\S+$/.test(lead.email) && lead.telefono.replace(/\D/g, "").length < 7) {
      setError(t("leadErrContacto"));
      return;
    }
    if (!acepta) { setError(t("leadErrConsentimiento")); return; }
    setError("");
    setEnviando(true);
    onEnviar(lead);
  };

  return (
    <div className="ai-card">
      <form className="ai-form" noValidate onSubmit={enviar}>
        <div className="ai-card__title">{t("leadTitulo")}</div>
        <label className="sr-only" htmlFor={`ln-${uid}`}>{t("leadNombre")}</label>
        <input
          className="input"
          id={`ln-${uid}`}
          name="nombre"
          placeholder={t("leadNombrePh")}
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <label className="sr-only" htmlFor={`le-${uid}`}>{t("leadEmail")}</label>
        <input
          className="input"
          id={`le-${uid}`}
          name="email"
          type="email"
          placeholder={t("leadEmailPh")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="sr-only" htmlFor={`lt-${uid}`}>{t("leadTelefono")}</label>
        <input
          className="input"
          id={`lt-${uid}`}
          name="telefono"
          type="tel"
          placeholder={t("leadTelefonoPh")}
          autoComplete="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <label className="sr-only" htmlFor={`ls-${uid}`}>{t("leadTipo")}</label>
        <select
          className="input"
          id={`ls-${uid}`}
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">{t("leadTipo")}</option>
          {TIPOS_EMPRESA.map((clave) => (
            <option key={clave} value={t(clave)}>{t(clave)}</option>
          ))}
        </select>
        <label className="ai-consent">
          <input type="checkbox" name="ok" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
          <span><Trozos trozos={parsearLinea(t("leadConsentimiento"))} /></span>
        </label>
        <p className="ai-form__err" hidden={!error}>{error}</p>
        <button className="btn btn--primary btn--block" type="submit" disabled={enviando}>
          {enviando ? t("leadEnviando") : t("leadEnviar")}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------
   El widget
------------------------------------------------------------ */
export default function Asistente({
  pagina = "",
  endpoint = "",
  leadEndpoint = "",
  precioBasic = "",
  precioPro = "",
  /* Los días de prueba salen del interruptor de la web (oferta.ts) y no
     de una constante propia: la promesa se dice igual en la cabecera, en
     las páginas de plan y aquí, y tiene que cambiar en un solo sitio. */
  diasPrueba = DIAS_DE_PRUEBA,
  whatsapp = CONFIG_POR_DEFECTO.whatsapp,
  email = CONFIG_POR_DEFECTO.email,
  retrasoTeaser = CONFIG_POR_DEFECTO.retrasoTeaser,
  rutas,
  consentimientoFuncional = false,
}: PropsAsistente) {
  const { locale } = useWebT();
  /* La prueba gratuita no siempre se ofrece (ver src/lib/web/oferta.ts).
     Cuando está apagada, el bloque `sinPrueba` del diccionario sustituye
     a la docena de frases que la prometían: el resto del guion -precios,
     módulos, objeciones- vale igual, así que no hay dos diccionarios
     enteros que mantener. */
  const textos = useMemo(() => {
    const base = locale === "en" ? asistenteEn : asistenteEs;
    return SE_OFRECE_PRUEBA ? base : { ...base, ...base.sinPrueba };
  }, [locale]);
  /* Sin prop se mira el data-page del <body>, que es de donde lo sacaba
     el original: así vale igual montado en cada página que montado una
     sola vez en el layout. */
  const [paginaActual, setPaginaActual] = useState(pagina);
  /* La página de la app para personas: ahí quien escribe suele querer
     reservar, no comprar el CRM. */
  const consumidor = paginaActual === "app";
  const ia = Boolean(endpoint);

  const config = useMemo<ConfigAsistente>(() => ({
    endpoint,
    leadEndpoint,
    precioBasic,
    precioPro,
    diasPrueba,
    whatsapp,
    email,
    retrasoTeaser,
    rutas: { ...RUTAS_POR_DEFECTO, ...rutas },
  }), [endpoint, leadEndpoint, precioBasic, precioPro, diasPrueba, whatsapp, email, retrasoTeaser, rutas]);

  /* --- estado ------------------------------------------------ */
  const S = useRef<EstadoChat>(estadoVacio());
  const vista = useRef<Vista>({
    abierto: false,
    restaurado: false,
    escribiendo: false,
    ocupado: false,
    teaser: null,
    teaserVisible: false,
    punto: false,
  });
  /* El motor es imperativo (igual que el original) y vive en refs; este
     contador es lo único que le pide a React volver a pintar. */
  const [, repintar] = useReducer((n: number) => n + 1, 0);
  const [borrador, setBorrador] = useState("");
  const [montado, setMontado] = useState(false);

  const vivo = useRef(true);
  const temporizadores = useRef(new Set<number>());
  const peticiones = useRef(new Set<AbortController>());
  const sinMovimiento = useRef(false);
  const mqPequena = useRef<MediaQueryList | null>(null);
  const funcional = useRef(consentimientoFuncional);
  const quitarEsperaConsent = useRef<(() => void) | null>(null);
  /* "instantáneo" al restaurar (no se ve bajar la conversación vieja),
     "suave" al añadir un mensaje. */
  const bajar = useRef<"no" | "suave" | "instantaneo">("no");

  const logRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const entradaRef = useRef<HTMLTextAreaElement | null>(null);
  const lanzadorRef = useRef<HTMLButtonElement | null>(null);

  /* El contexto se arma en cada llamada, nunca una vez por pintada: el
     perfil cambia a mitad de una cadena de await (al elegir sector, al
     contestar un paso) y con una copia vieja se contestaría con datos
     de hace dos mensajes. */
  const contexto = (): Contexto => ({ textos, config, perfil: S.current.perfil, consumidor });
  const T = (clave: ClaveTexto, extra?: Variables) => textoDe(contexto(), clave, extra);

  /* --- temporizadores y almacenamiento ----------------------- */
  const programar = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      temporizadores.current.delete(id);
      fn();
    }, ms);
    temporizadores.current.add(id);
    return id;
  };

  /* Las esperas del «está escribiendo» se acortan con movimiento
     reducido, igual que el original. Al desmontar se cancelan todas y
     la promesa se queda sin resolver: la cadena de await muere ahí, que
     es justo lo que se quiere. */
  const esperar = (ms: number) =>
    new Promise<void>((resolver) => {
      programar(resolver, sinMovimiento.current ? Math.min(ms, 180) : ms);
    });

  const almacen = (): Storage | null => {
    try {
      return funcional.current ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };

  /* El formulario de contacto no se guarda y la conversación se recorta
     a los últimos 60 mensajes, como en el original. */
  const estadoGuardable = (): EstadoChat => ({
    ...S.current,
    mensajes: S.current.mensajes.filter((m) => m.de !== "formulario"),
  });

  const guardar = () => {
    S.current.mensajes = S.current.mensajes.slice(-60);
    const s = almacen();
    if (!s) return;
    try {
      s.setItem(CLAVE, JSON.stringify(estadoGuardable()));
    } catch {
      /* sin almacenamiento (modo privado, cuota llena): el chat sigue en memoria */
    }
  };

  /* --- piezas de la conversación ----------------------------- */
  const anadir = (m: Mensaje) => {
    if (!vivo.current) return;
    S.current.mensajes.push(m);
    guardar();
    bajar.current = "suave";
    repintar();
  };

  const ponerChips = (lista: Chip[]) => {
    if (!vivo.current) return;
    S.current.chips = lista;
    guardar();
    bajar.current = "suave";
    repintar();
  };

  const limpiarChips = () => {
    S.current.chips = [];
    guardar();
    repintar();
  };

  const marcarOcupado = (v: boolean) => {
    vista.current.ocupado = v;
    repintar();
  };

  /** Escribe como una persona: puntitos y una espera según lo que va a decir. */
  const escribir = async (texto: string) => {
    vista.current.escribiendo = true;
    bajar.current = "suave";
    repintar();
    await esperar(Math.min(1500, 380 + texto.length * 7));
    if (!vivo.current) return;
    vista.current.escribiendo = false;
    anadir({ de: "bot", texto });
  };

  /* --- flujos guiados --------------------------------------- */
  const preguntarPaso = async (reintento = false) => {
    const f = S.current.flujo;
    if (!f) return;
    const pasos = pasosDelFlujo(f.nombre, contexto());
    /* Se salta lo que ya contestó (solo en «recomendar»: la cuenta de
       las ausencias se rehace entera) y lo que no aplica. */
    while (
      f.paso < pasos.length &&
      ((f.nombre === "recomendar" && respuestaDePaso(S.current.perfil, pasos[f.paso].clave) != null) ||
        pasos[f.paso].saltar)
    ) {
      f.paso += 1;
    }
    if (f.paso >= pasos.length) {
      const nombre = f.nombre;
      S.current.flujo = null;
      guardar();
      await (nombre === "recomendar" ? recomendarAhora() : calcularAhora());
      return;
    }
    const paso = pasos[f.paso];
    guardar();
    await escribir(reintento && paso.reintento ? paso.reintento : paso.pregunta);
    ponerChips(paso.opciones.map((o) => ({ etiqueta: o.etiqueta, valor: o.valor })));
  };

  const responderPaso = async (valor: ValorPaso) => {
    const f = S.current.flujo;
    if (!f) return;
    const paso = pasosDelFlujo(f.nombre, contexto())[f.paso];
    if (paso) S.current.perfil = guardarPaso(S.current.perfil, paso.clave, valor);
    f.paso += 1;
    guardar();
    await preguntarPaso();
  };

  const iniciarFlujo = async (nombre: NombreFlujo, limpio = false) => {
    if (limpio && nombre === "roi") S.current.perfil = olvidarRoi(S.current.perfil);
    S.current.flujo = { nombre, paso: 0 };
    guardar();
    await escribir(introFlujo(nombre, contexto()));
    await preguntarPaso();
  };

  const recomendarAhora = async () => {
    const { pro, motivos } = recomendarPlan(S.current.perfil);
    await escribir(introRecomendacion(contexto(), pro));
    anadir({ de: "plan", pro, motivos });
    await escribir(cierreRecomendacion(contexto(), pro));
    ponerChips(chipsRecomendacion(contexto(), pro));
  };

  const calcularAhora = async () => {
    const p = S.current.perfil;
    const calculo = calcularRoi(p);
    if (!calculo || p.citas == null || p.ticket == null || p.tasa == null) return;
    const moneda = paisDelRoi(p);
    await escribir(T("roiIntro", { moneda: moneda.curName }));
    anadir({ de: "roi", pais: moneda.code, citas: p.citas, ticket: p.ticket, tasa: p.tasa });
    await escribir(T("roiCierre"));
    const c = catalogoChips(contexto());
    ponerChips([c.trial, c.demo, c.recomendar]);
  };

  /* --- contacto --------------------------------------------- */
  const pedirContacto = async (prefill: { email?: string; telefono?: string } = {}) => {
    await escribir(T(S.current.lead ? "leadIntroRepetido" : "leadIntro"));
    anadir({
      de: "formulario",
      id: `${Date.now().toString(36)}-${S.current.mensajes.length}`,
      nombre: S.current.perfil.nombre ?? "",
      email: prefill.email ?? "",
      telefono: prefill.telefono ?? "",
    });
  };

  const enviarContacto = async (id: string, lead: Lead) => {
    if (!S.current.perfil.nombre) {
      S.current.perfil = { ...S.current.perfil, nombre: lead.nombre.split(" ")[0] };
    }
    const resumen = resumenLead(contexto(), lead);
    let enviado = false;
    if (config.leadEndpoint) {
      const ctl = new AbortController();
      peticiones.current.add(ctl);
      try {
        const r = await fetch(config.leadEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctl.signal,
          /* Mismo cuerpo que el api/lead.php del original, «web» incluido:
             es el campo trampa para bots y va vacío a propósito. */
          body: JSON.stringify({
            ...lead,
            consentimiento: true,
            perfil: perfilParaApi(contexto()),
            pagina: paginaActual,
            resumen,
            web: "",
          }),
        });
        enviado = r.ok;
      } catch {
        enviado = false;
      } finally {
        peticiones.current.delete(ctl);
      }
    }
    if (!vivo.current) return;
    S.current.mensajes = S.current.mensajes.filter((m) => !(m.de === "formulario" && m.id === id));
    S.current.lead = true;
    guardar();
    repintar();
    const pila = lead.nombre.split(" ")[0];
    if (enviado) {
      await escribir(T("leadGracias", { nombre: pila }));
      const c = catalogoChips(contexto());
      ponerChips([c.trial, c.basic]);
    } else {
      /* Sin endpoint (que es como viene de serie) el contacto se cierra
         por WhatsApp o por correo, con el recado ya escrito. */
      await escribir(T("leadGraciasManual", { nombre: pila }));
      anadir({ de: "envio", resumen });
    }
  };

  /* --- respuestas ------------------------------------------- */
  const atender = async (intencion: ClaveIntencion) => {
    if (intencion === "demo") { await pedirContacto(); return; }
    if (intencion === "recomendar") { await iniciarFlujo("recomendar"); return; }
    if (intencion === "roi") { await iniciarFlujo("roi", true); return; }
    const r = responder(intencion, contexto());
    if (r.sectorContado) S.current.perfil = { ...S.current.perfil, contado: true };
    await escribir(r.texto);
    if (r.chips.length) ponerChips(r.chips);
  };

  /** A partir del cuarto mensaje se ofrece la recomendación, una sola vez. */
  const empujon = async () => {
    if (consumidor || S.current.turnos < 4 || S.current.lead || S.current.empujado || S.current.flujo) return;
    S.current.empujado = true;
    guardar();
    await escribir(T("empujon"));
    ponerChips(chipsEmpujon(contexto()));
  };

  /** Pregunta al endpoint de IA. false si no hay respuesta útil: se cae al guion. */
  const preguntarIa = async (): Promise<boolean> => {
    vista.current.escribiendo = true;
    bajar.current = "suave";
    repintar();
    const ctl = new AbortController();
    peticiones.current.add(ctl);
    const reloj = programar(() => ctl.abort(), 25000);
    try {
      const historial = S.current.mensajes.filter(esMensajeTexto).slice(-14).map((m) => ({
        role: m.de === "usuario" ? "user" : "assistant",
        content: m.texto,
      }));
      const r = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctl.signal,
        /* Mismo contrato que el api/asistente.php del original, con las
           claves que esperaba el prompt (team, pain, rate…). */
        body: JSON.stringify({ messages: historial, page: paginaActual, profile: perfilParaApi(contexto()) }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const datos: unknown = await r.json();
      const respuesta =
        typeof datos === "object" && datos !== null && "reply" in datos
          ? (datos as { reply: unknown }).reply
          : null;
      if (typeof respuesta !== "string" || !respuesta.trim()) throw new Error("respuesta vacia");
      if (!vivo.current) return false;
      vista.current.escribiendo = false;
      anadir({ de: "bot", texto: respuesta.trim() });
      return true;
    } catch {
      vista.current.escribiendo = false;
      repintar();
      return false;
    } finally {
      peticiones.current.delete(ctl);
      window.clearTimeout(reloj);
      temporizadores.current.delete(reloj);
    }
  };

  /* --- turnos ----------------------------------------------- */
  const alEscribir = async (texto: string) => {
    if (vista.current.ocupado || !texto) return;
    marcarOcupado(true);
    limpiarChips();
    anadir({ de: "usuario", texto });
    S.current.turnos += 1;
    const n = normalizar(texto);
    S.current.perfil = extraerPerfil(texto, n, S.current.perfil);
    guardar();

    if (S.current.flujo) {
      const f = S.current.flujo;
      const paso = pasosDelFlujo(f.nombre, contexto())[f.paso];
      const v = paso ? paso.leer(n, texto) : null;
      if (v !== null && !(typeof v === "number" && Number.isNaN(v))) {
        await responderPaso(v);
        marcarOcupado(false);
        return;
      }
      /* No se ha entendido: si tampoco parece otra pregunta, se repite el
         paso; si lo parece, se abandona el flujo y se contesta. */
      if (paso?.reintento && detectarIntencion(n, S.current.perfil) === "fallback") {
        await preguntarPaso(true);
        marcarOcupado(false);
        return;
      }
      S.current.flujo = null;
      guardar();
    }

    const correo = texto.match(/\S+@\S+\.\S+/);
    const telefono = texto.match(/(?:\+?\d[\d\s]{7,}\d)/);
    if (correo || telefono) {
      await pedirContacto({ email: correo?.[0] ?? "", telefono: telefono?.[0] ?? "" });
      marcarOcupado(false);
      return;
    }

    const intencion = detectarIntencion(n, S.current.perfil);
    if (config.endpoint && !esIntencionGuiada(intencion)) {
      const ok = await preguntarIa();
      if (ok) {
        /* La IA ya ha contestado: del guion solo se cogen los chips (y el
           apunte de que el sector ya se contó). */
        const r = responder(intencion, contexto());
        if (r.sectorContado) S.current.perfil = { ...S.current.perfil, contado: true };
        if (r.chips.length) ponerChips(r.chips);
        await empujon();
        marcarOcupado(false);
        return;
      }
    }
    await atender(intencion);
    await empujon();
    marcarOcupado(false);
  };

  const ejecutarAccion = async (accion: Accion, etiqueta?: string) => {
    if (vista.current.ocupado) return;
    marcarOcupado(true);
    limpiarChips();
    if (etiqueta) anadir({ de: "usuario", texto: etiqueta });
    if (accion.tipo === "flujo") {
      await iniciarFlujo(accion.flujo, true);
    } else if (accion.tipo === "sector") {
      S.current.perfil = { ...S.current.perfil, sector: accion.sector, contado: false };
      guardar();
      await atender("sector");
    } else if (accion.tipo === "equipo") {
      /* El tamaño del equipo abre la recomendación ya con ese paso resuelto. */
      S.current.perfil = { ...S.current.perfil, equipo: accion.personas };
      guardar();
      S.current.flujo = { nombre: "recomendar", paso: 0 };
      await preguntarPaso();
    } else {
      await atender(accion.intencion);
    }
    marcarOcupado(false);
  };

  const pulsarChip = async (c: Chip) => {
    if (c.href) {
      /* El chip es un enlace: el navegador abre la pestaña y aquí solo se
         deja constancia en la conversación. */
      limpiarChips();
      anadir({ de: "usuario", texto: c.etiqueta });
      await escribir(T("abiertoEnPestana"));
      return;
    }
    if (c.valor !== undefined && S.current.flujo) {
      if (vista.current.ocupado) return;
      marcarOcupado(true);
      limpiarChips();
      anadir({ de: "usuario", texto: c.etiqueta });
      await responderPaso(c.valor);
      marcarOcupado(false);
      return;
    }
    if (c.accion) await ejecutarAccion(c.accion, c.etiqueta);
  };

  /* --- abrir, cerrar, sugerencia ---------------------------- */
  const ocultarTeaser = (recordar: boolean) => {
    vista.current.teaserVisible = false;
    repintar();
    if (!recordar) return;
    try {
      sessionStorage.setItem(CLAVE_TEASER, "1");
    } catch {
      /* sin almacenamiento: la sugerencia podrá volver a salir */
    }
  };

  const mostrarTeaser = () => {
    const t = teaserDePagina(paginaActual, contexto());
    if (!t || S.current.yaAbierto || document.body.classList.contains("ai-open")) return;
    try {
      if (sessionStorage.getItem(CLAVE_TEASER)) return;
    } catch {
      /* sin almacenamiento: adelante */
    }
    /* En móvil, con el aviso de cookies delante la sugerencia no se ve:
       se espera a que el visitante decida y se reintenta. */
    if (mqPequena.current?.matches && document.body.classList.contains("cc-visible")) {
      const alDecidir = () => programar(() => mostrarTeaserRef.current(), 2500);
      document.addEventListener("bookmy:consent", alDecidir, { once: true });
      quitarEsperaConsent.current = () => document.removeEventListener("bookmy:consent", alDecidir);
      return;
    }
    vista.current.teaser = t;
    vista.current.teaserVisible = true;
    vista.current.punto = true;
    repintar();
  };

  const restaurar = () => {
    if (vista.current.restaurado) return;
    vista.current.restaurado = true;
    bajar.current = "instantaneo";
    repintar();
  };

  const abrir = async (apertura?: Apertura) => {
    restaurar();
    ocultarTeaser(false);
    vista.current.punto = false;
    vista.current.abierto = true;
    repintar();
    document.body.classList.add("ai-open");
    /* En móvil el panel ocupa la pantalla: se bloquea el scroll de detrás. */
    if (mqPequena.current?.matches) document.body.classList.add("is-locked");
    if (window.matchMedia("(pointer: fine)").matches) {
      programar(() => entradaRef.current?.focus({ preventScroll: true }), 250);
    }
    const primera = !S.current.yaAbierto && !S.current.mensajes.length;
    S.current.yaAbierto = true;
    guardar();
    if (primera) {
      marcarOcupado(true);
      if (apertura) {
        /* Se abre con algo que hacer: saludo corto y a lo que venía. */
        await escribir(T("aperturaCorta"));
      } else {
        await escribir(T(consumidor ? "aperturaConsumidor" : "aperturaNegocio"));
        ponerChips(chipsApertura(contexto()));
      }
      marcarOcupado(false);
    }
    if (!apertura) return;
    if (apertura.tipo === "preguntar") await alEscribir(apertura.texto);
    else await ejecutarAccion(apertura.accion, apertura.etiqueta);
  };

  const cerrar = () => {
    vista.current.abierto = false;
    repintar();
    document.body.classList.remove("ai-open", "is-locked");
    lanzadorRef.current?.focus({ preventScroll: true });
  };

  const reiniciar = () => {
    S.current = estadoVacio();
    S.current.yaAbierto = true;
    guardar();
    vista.current.restaurado = true;
    vista.current.escribiendo = false;
    vista.current.ocupado = false;
    repintar();
    void (async () => {
      marcarOcupado(true);
      await escribir(T("reinicio"));
      ponerChips(chipsApertura(contexto()));
      marcarOcupado(false);
    })();
  };

  /* --- lo que tiene que estar siempre al día ---------------- */
  const mostrarTeaserRef = useRef(mostrarTeaser);
  const abrirRef = useRef(abrir);
  const cerrarRef = useRef(cerrar);
  const estadoGuardableRef = useRef(estadoGuardable);
  useEffect(() => {
    /* Los listeners y los temporizadores se registran una sola vez, así
       que llaman a través de estos refs para no quedarse con la versión
       de la primera pintada. */
    mostrarTeaserRef.current = mostrarTeaser;
    abrirRef.current = abrir;
    cerrarRef.current = cerrar;
    estadoGuardableRef.current = estadoGuardable;
  });

  /* El consentimiento manda sobre dónde se guarda: con cookies
     funcionales, entre visitas; sin ellas, solo esta sesión. */
  useEffect(() => {
    funcional.current = consentimientoFuncional;
  }, [consentimientoFuncional]);

  /* La prop, si llega, siempre gana al data-page del <body>. */
  useEffect(() => {
    if (pagina) setPaginaActual(pagina);
  }, [pagina]);

  /* --- arranque y desmontaje -------------------------------- */
  useEffect(() => {
    vivo.current = true;
    sinMovimiento.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mqPequena.current = window.matchMedia("(max-width: 560px)");
    if (!pagina) {
      const delCuerpo = document.body.dataset.page;
      if (delCuerpo) setPaginaActual(delCuerpo);
    }

    /* La conversación guardada se lee aquí y no en el render para que el
       HTML del servidor y el del cliente coincidan. */
    try {
      const crudo = (funcional.current ? window.localStorage : window.sessionStorage).getItem(CLAVE);
      if (crudo) S.current = sanearEstado(JSON.parse(crudo) as unknown);
    } catch {
      /* sin almacenamiento o con basura dentro: se empieza limpio */
    }
    setMontado(true);

    /* Botones de la página que abren el asistente, igual que el original:
       data-assistant-open · data-assistant-ask · data-assistant-flow
       (+ data-assistant-label para lo que se ve escrito en el chat). */
    const alClicGlobal = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const b = e.target.closest<HTMLElement>(
        "[data-assistant-open],[data-assistant-ask],[data-assistant-flow]"
      );
      if (!b) return;
      e.preventDefault();
      const pregunta = b.dataset.assistantAsk;
      const flujo = b.dataset.assistantFlow;
      if (pregunta) {
        void abrirRef.current({ tipo: "preguntar", texto: pregunta });
        return;
      }
      if (flujo) {
        const nombre = interpretarFlujo(flujo);
        if (nombre) {
          void abrirRef.current({
            tipo: "accion",
            accion: { tipo: "flujo", flujo: nombre },
            etiqueta: b.dataset.assistantLabel || (b.textContent ?? "").trim(),
          });
        }
        return;
      }
      void abrirRef.current();
    };
    document.addEventListener("click", alClicGlobal);

    /* Cuando el visitante decide sobre las cookies, la conversación pasa
       a guardarse entre visitas o se borra del almacenamiento duradero. */
    const alConsentir = (e: Event) => {
      const detalle = (e as CustomEvent<{ functional?: boolean }>).detail;
      const puede = Boolean(detalle?.functional);
      funcional.current = puede;
      try {
        if (puede) window.localStorage.setItem(CLAVE, JSON.stringify(estadoGuardableRef.current()));
        else window.localStorage.removeItem(CLAVE);
      } catch {
        /* sin almacenamiento: nada que migrar */
      }
    };
    document.addEventListener("bookmy:consent", alConsentir);

    const api: ApiAsistente = {
      open: () => void abrirRef.current(),
      ask: (t: string) => void abrirRef.current({ tipo: "preguntar", texto: String(t) }),
      flow: (n: string) => {
        const nombre = interpretarFlujo(n);
        if (nombre) void abrirRef.current({ tipo: "accion", accion: { tipo: "flujo", flujo: nombre } });
      },
      close: () => cerrarRef.current(),
    };
    window.BookmyAssistant = api;

    /* El retraso se lee una sola vez, como la constante del original: si
       entrara en las dependencias, cambiarlo volvería a montar el motor
       entero y la conversación se releería del almacenamiento. */
    const reloj = programar(() => mostrarTeaserRef.current(), retrasoTeaser);

    return () => {
      vivo.current = false;
      window.clearTimeout(reloj);
      temporizadores.current.forEach((id) => window.clearTimeout(id));
      temporizadores.current.clear();
      peticiones.current.forEach((c) => c.abort());
      peticiones.current.clear();
      document.removeEventListener("click", alClicGlobal);
      document.removeEventListener("bookmy:consent", alConsentir);
      quitarEsperaConsent.current?.();
      quitarEsperaConsent.current = null;
      /* El widget es el único que pone estas clases: al irse, se van. */
      document.body.classList.remove("ai-open", "is-locked");
      if (window.BookmyAssistant === api) delete window.BookmyAssistant;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* El panel cerrado no debe recibir foco ni lecturas. `inert` no es
     propiedad de JSX en React 18, así que se pone a mano. */
  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !vista.current.abierto;
  });

  /* Bajar el log después de pintar, solo cuando algo se ha añadido: así
     no se le roba el scroll a quien está leyendo hacia arriba. */
  useEffect(() => {
    const log = logRef.current;
    if (!log || bajar.current === "no") return;
    if (bajar.current === "instantaneo") {
      log.style.scrollBehavior = "auto";
      log.scrollTop = log.scrollHeight;
      log.style.scrollBehavior = "";
    } else {
      log.scrollTop = log.scrollHeight;
    }
    bajar.current = "no";
  });

  /* --- pintado ---------------------------------------------- */
  const v = vista.current;
  const puedeEnviar = !v.ocupado && borrador.trim().length > 0;

  const alEnviarFormulario = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const texto = borrador.trim().slice(0, 600);
    if (!texto || v.ocupado) return;
    setBorrador("");
    if (entradaRef.current) entradaRef.current.style.height = "auto";
    void alEscribir(texto);
  };

  const pintarMensaje = (m: Mensaje, i: number): ReactNode => {
    if (m.de === "bot") {
      return (
        <div className="ai-msg ai-msg--bot" key={i}>
          <span className="orb-av" aria-hidden="true" />
          <div className="ai-bubble"><Markdown texto={m.texto} /></div>
        </div>
      );
    }
    if (m.de === "usuario") {
      return (
        <div className="ai-msg ai-msg--user" key={i}>
          <div className="ai-bubble"><LineasSueltas texto={m.texto} /></div>
        </div>
      );
    }
    if (m.de === "plan") {
      return (
        <div className={`ai-card${m.pro ? " ai-card--dark" : ""}`} key={i}>
          <div className="ai-card__title">
            {T(m.pro ? "tarjetaPro" : "tarjetaBasic")}
            <span className={m.pro ? "tag tag--dark" : "tag"}>{T("tarjetaRecomendado")}</span>
          </div>
          <ul className="checks">
            {m.motivos.map((motivo) => <li key={motivo}>{T(motivo)}</li>)}
          </ul>
          <a
            className={`btn ${m.pro ? "btn--mint" : "btn--primary"} btn--block`}
            href={m.pro ? config.rutas.altaPro : config.rutas.altaBasic}
            target="_blank"
            rel="noopener"
          >
            {T("tarjetaProbar")}
          </a>
          <small>{T("tarjetaGarantia")}</small>
        </div>
      );
    }
    if (m.de === "roi") {
      const calculo = calcularRoi({ citas: m.citas, ticket: m.ticket, tasa: m.tasa });
      if (!calculo) return null;
      const p = pais(m.pais);
      const dinero = (valor: number) => formatearDinero(valor, p.code);
      /* Los dos códigos genéricos («otro país en euros/dólares») no tienen
         país que enseñar en la nota. */
      const generico = p.code === "eu" || p.code === "usd";
      return (
        <div className="ai-card ai-card--dark" key={i}>
          <div className="ai-card__title">{T("roiTitulo")}</div>
          <div className="ai-card__big">{dinero(calculo.perdidaMes)}</div>
          <small>
            {T("roiDetalle", {
              citasPerdidas: calculo.citasPerdidas,
              citas: m.citas,
              ticket: dinero(m.ticket),
            })}
          </small>
          <hr style={{ border: 0, borderTop: "1px solid rgba(255, 255, 255, .1)" }} />
          <div>
            <Trozos
              trozos={parsearLinea(
                T("roiRecupera", {
                  mes: dinero(calculo.recuperaMes),
                  anio: dinero(calculo.recuperaAnio),
                })
              )}
            />
          </div>
          <small>
            {T(generico ? "roiNota" : "roiNotaPais", {
              moneda: p.curName,
              cur: p.cur,
              pais: p.name,
            })}
          </small>
        </div>
      );
    }
    if (m.de === "envio") {
      return (
        <div className="ai-card" key={i}>
          <div className="ai-card__title">{T("envioTitulo")}</div>
          <a
            className="btn btn--primary btn--block"
            href={enlaceWhatsapp(config, m.resumen)}
            target="_blank"
            rel="noopener"
          >
            <i className="i i-message-circle" aria-hidden="true" />
            {T("envioWhatsapp")}
          </a>
          <a
            className="btn btn--outline btn--block"
            href={enlaceCorreo(config, T("envioAsunto"), m.resumen)}
          >
            <i className="i i-mail" aria-hidden="true" />
            {T("envioEmail")}
          </a>
        </div>
      );
    }
    return (
      <FormularioLead
        key={i}
        ctx={contexto()}
        prefill={{ nombre: m.nombre, email: m.email, telefono: m.telefono }}
        onEnviar={(lead) => void enviarContacto(m.id, lead)}
      />
    );
  };

  const contenido = (
    <div className="ai-root">
      <button
        className="ai-launcher"
        type="button"
        ref={lanzadorRef}
        aria-label={T("abrirAria")}
        aria-expanded={v.abierto}
        aria-controls="ai-panel"
        onClick={() => void abrir()}
      >
        <i className="i i-sparkles" aria-hidden="true" />
        <span className="ai-launcher__dot" hidden={!v.punto} />
      </button>

      <div className={`ai-teaser${v.teaserVisible ? " is-visible" : ""}`} role="status">
        <button
          className="ai-teaser__close"
          type="button"
          aria-label={T("cerrarSugerenciaAria")}
          onClick={() => { ocultarTeaser(true); vista.current.punto = false; repintar(); }}
        >
          <i className="i i-x" aria-hidden="true" />
        </button>
        <button
          className="ai-teaser__txt"
          type="button"
          onClick={() => {
            const t = v.teaser;
            ocultarTeaser(true);
            void abrir(t ? { tipo: "accion", accion: t.accion, etiqueta: t.etiqueta } : undefined);
          }}
        >
          {v.teaser?.texto ?? ""}
        </button>
        <small>{ia ? T("teaserIa") : T("teaserSinIa")}</small>
      </div>

      <section
        className={`ai-panel${v.abierto ? " is-open" : ""}`}
        id="ai-panel"
        role="dialog"
        aria-label={T("nombre")}
        aria-hidden={!v.abierto}
        ref={panelRef}
        onKeyDown={(e) => { if (e.key === "Escape") cerrar(); }}
      >
        <header className="ai-head">
          <span className="orb-av" aria-hidden="true" />
          <div className="ai-head__txt">
            <b>
              {T("nombre")}
              {ia && <span className="tag tag--dark">{T("tagIa")}</span>}
            </b>
            <small>{T("enLinea")}</small>
          </div>
          <button className="ai-head__btn" type="button" aria-label={T("reiniciarAria")} onClick={reiniciar}>
            <i className="i i-rotate-ccw" aria-hidden="true" />
          </button>
          <button className="ai-head__btn" type="button" aria-label={T("cerrarAria")} onClick={cerrar}>
            <i className="i i-x" aria-hidden="true" />
          </button>
        </header>

        <div className="ai-log" aria-live="polite" ref={logRef}>
          {v.restaurado && (
            <p className="ai-disclaimer">
              <Trozos trozos={parsearLinea(T(ia ? "avisoIa" : "avisoSinIa"))} />
            </p>
          )}
          {v.restaurado && S.current.mensajes.map(pintarMensaje)}
          {v.escribiendo && (
            <div className="ai-typing typing" aria-hidden="true"><i /><i /><i /></div>
          )}
          {v.restaurado && S.current.chips.length > 0 && (
            <div className="ai-chips">
              {S.current.chips.map((c, i) => (c.href ? (
                <a
                  key={i}
                  className={`ai-chip${c.principal ? " ai-chip--primary" : ""}`}
                  href={c.href}
                  target="_blank"
                  rel="noopener"
                  onClick={() => void pulsarChip(c)}
                >
                  {c.etiqueta}
                </a>
              ) : (
                <button
                  key={i}
                  type="button"
                  className={`ai-chip${c.principal ? " ai-chip--primary" : ""}`}
                  onClick={() => void pulsarChip(c)}
                >
                  {c.etiqueta}
                </button>
              )))}
            </div>
          )}
        </div>

        <form className="ai-compose" autoComplete="off" onSubmit={alEnviarFormulario}>
          <label className="sr-only" htmlFor="ai-input">{T("campoAria")}</label>
          <textarea
            id="ai-input"
            rows={1}
            maxLength={600}
            placeholder={T("marcador")}
            ref={entradaRef}
            value={borrador}
            onChange={(e) => {
              setBorrador(e.target.value);
              /* Crece con el texto hasta donde llega la caja (120px en CSS). */
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              /* Enter envía; Mayús+Enter hace un salto de línea, y con el
                 teclado de un idioma con composición no se interrumpe. */
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button className="ai-send" type="submit" aria-label={T("enviarAria")} disabled={!puedeEnviar}>
            <i className="i i-send" aria-hidden="true" />
          </button>
        </form>

        <p className="ai-foot">
          {ia ? T("pieIa") : T("pieSinIa")}{" · "}
          <a href={config.rutas.privacidadAsistente}>{T("piePrivacidad")}</a>
        </p>
      </section>
    </div>
  );

  /* Antes de montar no hay <body> al que ir: el original tampoco existía
     hasta que corría el script. */
  return montado ? createPortal(contenido, document.body) : null;
}
