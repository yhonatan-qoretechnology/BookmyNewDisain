/* ============================================================
   La cabeza del asistente vendedor de la web pública
   ------------------------------------------------------------
   Puerto de js/assistant.js de la web estática. Aquí vive TODO
   lo que el asistente sabe y decide; el DOM lo pone
   components/web/Asistente.tsx. Por eso este archivo no toca
   window ni document: así se puede evaluar en el servidor, se
   puede probar sin navegador y el componente queda siendo solo
   la vista.

   Los textos NO están aquí. La web es bilingüe, así que cada
   respuesta es una clave del diccionario
   (i18n/dictionaries/web/asistente.es|en.ts) y este archivo
   decide QUÉ clave toca y con qué datos se rellena.

   Lo que sí está aquí, tal cual lo tenía el original:
     · las palabras con las que reconoce la intención y el sector
       (en español: el original tampoco entendía inglés escrito,
       ver el informe del puerto),
     · los dos flujos guiados (recomendar plan y calcular las
       ausencias),
     · la cuenta del ROI y la regla para recomendar plan,
     · el resumen que se le manda al equipo con cada contacto.

   El país y la moneda salen de ./money.ts (la tabla de países de
   la web); no se redeclara nada de eso aquí.
============================================================ */
import { FUERA, WEB } from "@/lib/web/rutas";
import {
  PAISES,
  formatearDinero,
  leerImporte,
  pais,
  paisProbable,
  reconocerPais,
  type PaisMoneda,
} from "@/lib/web/money";

/* ------------------------------------------------------------
   1. Configuración
   ------------------------------------------------------------
   Equivale al objeto CONFIG del original. Los dos endpoints
   (asistente con IA y envío de contactos) eran PHP y no se han
   portado: en vacío el asistente funciona con sus respuestas
   guionizadas, que es como venía configurado de serie.
------------------------------------------------------------ */

/** Todos los enlaces que el asistente puede ofrecer. */
export interface RutasAsistente {
  /** Alta con el plan ya elegido. */
  altaBasic: string;
  altaPro: string;
  /** Alta sin plan (el enlace de «empieza tu prueba»). */
  crearCuenta: string;
  planBasic: string;
  planPro: string;
  planes: string;
  comoFunciona: string;
  asistenteIa: string;
  quienesSomos: string;
  appEmpresas: string;
  privacidad: string;
  /** La privacidad apuntando al apartado del asistente. */
  privacidadAsistente: string;
  login: string;
  playStore: string;
  appStore: string;
  apk: string;
}

export interface ConfigAsistente {
  /** API de respuestas con IA. Vacío = solo respuestas guionizadas. */
  endpoint: string;
  /** API que recibe los contactos. Vacío = se envían por WhatsApp o correo. */
  leadEndpoint: string;
  /** Precio del plan tal cual se escribe («9 €/mes + IVA»). Vacío = no se menciona. */
  precioBasic: string;
  precioPro: string;
  diasPrueba: number;
  /** Número de WhatsApp sin «+» ni espacios, como lo quiere wa.me. */
  whatsapp: string;
  email: string;
  /** Milisegundos hasta la sugerencia flotante. */
  retrasoTeaser: number;
  rutas: RutasAsistente;
}

/* Las direcciones salen de lib/web/rutas.ts, que es donde vive el mapa
   de la web: el original enlazaba archivos («plan-basic.html») y en Next
   son rutas que ademas han cambiado de sitio (/planes/basic). Si se
   escribieran aqui otra vez, el dia que una se mueva el asistente seria
   el ultimo en enterarse.

   OJO con altaBasic: el alta de la web nueva entiende ?plan=basic, pero
   el asistente de alta que hay hoy en el repositorio (SignupWizard) solo
   distingue «free» y «pro», asi que con «basic» abre Pro. Esta puesto
   como en el original. El alta entiende los dos nombres del plan
   gratuito ("basic", que es como lo llama la web, y "free", que es como
   lo llama el backend), asi que este enlace no necesita apano. */
export const RUTAS_POR_DEFECTO: RutasAsistente = {
  altaBasic: `${WEB.crearCuenta}?plan=basic`,
  altaPro: `${WEB.crearCuenta}?plan=pro`,
  crearCuenta: WEB.crearCuenta,
  planBasic: WEB.planBasic,
  planPro: WEB.planPro,
  planes: WEB.planes,
  comoFunciona: WEB.comoFunciona,
  asistenteIa: WEB.asistenteIa,
  quienesSomos: WEB.quienesSomos,
  appEmpresas: WEB.appEmpresas,
  privacidad: WEB.privacidad,
  privacidadAsistente: `${WEB.privacidad}#asistente`,
  login: WEB.login,
  playStore: FUERA.googlePlay,
  appStore: FUERA.appStore,
  apk: FUERA.apk,
};

export const CONFIG_POR_DEFECTO: ConfigAsistente = {
  endpoint: "",
  leadEndpoint: "",
  precioBasic: "",
  precioPro: "",
  diasPrueba: 7,
  whatsapp: "34651026700",
  email: "contacto@bookmy.es",
  retrasoTeaser: 9000,
  rutas: RUTAS_POR_DEFECTO,
};

/* ------------------------------------------------------------
   2. El diccionario
   ------------------------------------------------------------
   Esta interfaz es el contrato de los dos diccionarios: si a uno
   le falta una clave o le sobra, TypeScript lo canta. Los textos
   admiten {variables} y un markdown mínimo (**negrita**, listas
   con «- » y [enlaces](destino)).
------------------------------------------------------------ */
export interface TextosAsistente {
  /* Marco de la ventana */
  nombre: string;
  tagIa: string;
  abrirAria: string;
  cerrarAria: string;
  reiniciarAria: string;
  cerrarSugerenciaAria: string;
  teaserIa: string;
  teaserSinIa: string;
  enLinea: string;
  campoAria: string;
  marcador: string;
  enviarAria: string;
  pieIa: string;
  pieSinIa: string;
  piePrivacidad: string;
  avisoIa: string;
  avisoSinIa: string;

  /* Arranque de la conversación */
  hola: string;
  holaNombre: string;
  aperturaNegocio: string;
  aperturaConsumidor: string;
  aperturaCorta: string;
  reinicio: string;
  abiertoEnPestana: string;
  empujon: string;

  /* Chips del menú */
  chipQueEs: string;
  chipRecomendar: string;
  chipRoi: string;
  chipPlanes: string;
  chipTrial: string;
  chipBasic: string;
  chipDescargar: string;
  chipReservar: string;
  chipNegocio: string;
  chipDemo: string;
  chipIa: string;
  chipFunciona: string;

  /* Sectores: chip (en mayúscula) y nombre de pasada (en minúscula) */
  chipSectorEstetica: string;
  chipSectorPeluqueria: string;
  chipSectorSalud: string;
  chipSectorOtro: string;
  nombreSectorEstetica: string;
  nombreSectorPeluqueria: string;
  nombreSectorSalud: string;
  nombreSectorBienestar: string;
  nombreSectorTatuajes: string;
  nombreSectorConstruccion: string;
  nombreSectorTecnologia: string;
  nombreSectorServicios: string;

  /* Discurso por sector */
  pitchEstetica: string;
  pitchPeluqueria: string;
  pitchSalud: string;
  pitchBienestar: string;
  pitchTatuajes: string;
  pitchConstruccion: string;
  pitchTecnologia: string;
  pitchServicios: string;

  /* Piezas que se reutilizan dentro de las respuestas */
  textoPrueba: string;
  precioCon: string;
  precioSin: string;
  enlaceGooglePlay: string;
  enlaceAppStore: string;
  enlaceApk: string;
  soporteWaTexto: string;

  /* Respuestas guionizadas */
  resSaludoNegocio: string;
  resSaludoConsumidor: string;
  resQueEs: string;
  resSector: string;
  resPrecio: string;
  resPrueba: string;
  resPermanencia: string;
  resCaro: string;
  resAusencias: string;
  resReservas: string;
  resReservar: string;
  resCancelar: string;
  resGratisApp: string;
  resDescargar: string;
  resApk: string;
  resEmpresasApp: string;
  resCrm: string;
  resPagos: string;
  resEquipo: string;
  resSedes: string;
  resStock: string;
  resEstadisticas: string;
  resResenas: string;
  resComunicacion: string;
  resAutomatizar: string;
  resIa: string;
  resAppConsumidor: string;
  resAppNegocio: string;
  resSeguridad: string;
  resYaUso: string;
  resTiempo: string;
  resWhatsapp: string;
  resIdioma: string;
  resQuienes: string;
  resFunciona: string;
  resSoporte: string;
  resGracias: string;
  resDespedida: string;
  resFallbackConsumidor: string;
  resFallbackNegocio: string;

  /* Flujo «recomiendame un plan» */
  flujoRecomendarIntro: string;
  pasoEquipo: string;
  opEquipoSolo: string;
  opEquipoPocos: string;
  opEquipoMedio: string;
  opEquipoMuchos: string;
  pasoSedes: string;
  opSedesUna: string;
  opSedesPocas: string;
  opSedesMuchas: string;
  pasoPrioridad: string;
  opPrioridadAgenda: string;
  opPrioridadAusencias: string;
  opPrioridadCobros: string;
  opPrioridadEquipo: string;
  opPrioridadVentas: string;

  /* Flujo «cuánto pierdo por ausencias» */
  flujoRoiIntro: string;
  pasoPais: string;
  opOtroPais: string;
  reintentoPais: string;
  pasoMoneda: string;
  opEuros: string;
  opDolares: string;
  reintentoMoneda: string;
  pasoCitas: string;
  pasoTicket: string;
  pasoTasa: string;
  opTasaCasiNinguna: string;
  opTasaMuchas: string;

  /* Recomendación */
  recPro: string;
  recProSector: string;
  recBasic: string;
  recProCierre: string;
  recBasicCierre: string;
  tarjetaPro: string;
  tarjetaBasic: string;
  tarjetaRecomendado: string;
  tarjetaProbar: string;
  tarjetaGarantia: string;
  motivoEquipo: string;
  motivoSedes: string;
  motivoAusencias: string;
  motivoCobros: string;
  motivoVentas: string;
  motivoEquipoSolo: string;
  motivoEstadisticas: string;
  motivoReservas: string;
  motivoConfirmaciones: string;
  motivoMovil: string;
  motivoCrecer: string;

  /* Resultado del ROI */
  roiIntro: string;
  roiTitulo: string;
  roiDetalle: string;
  roiRecupera: string;
  roiNota: string;
  roiNotaPais: string;
  roiCierre: string;

  /* Captación de contactos */
  leadIntro: string;
  leadIntroRepetido: string;
  leadTitulo: string;
  leadNombre: string;
  leadNombrePh: string;
  leadEmail: string;
  leadEmailPh: string;
  leadTelefono: string;
  leadTelefonoPh: string;
  leadTipo: string;
  tipoSalud: string;
  tipoEstetica: string;
  tipoConstruccion: string;
  tipoTecnologia: string;
  tipoServicios: string;
  tipoOtros: string;
  leadConsentimiento: string;
  leadEnviar: string;
  leadEnviando: string;
  leadErrNombre: string;
  leadErrContacto: string;
  leadErrConsentimiento: string;
  leadGracias: string;
  leadGraciasManual: string;
  envioTitulo: string;
  envioWhatsapp: string;
  envioEmail: string;
  envioAsunto: string;
  resumenHola: string;
  resumenEquipo: string;
  resumenSolo: string;
  resumenPersonas: string;
  resumenSedes: string;
  resumenPrioridad: string;
  resumenContacto: string;

  /* Sugerencias flotantes por página */
  teaserCrm: string;
  teaserCrmEtiqueta: string;
  teaserApp: string;
  teaserAppEtiqueta: string;
  teaserAppEmpresas: string;
  teaserAppEmpresasEtiqueta: string;
  teaserPlanBasic: string;
  teaserPlanBasicEtiqueta: string;
  teaserPlanPro: string;
  teaserPlanProEtiqueta: string;
  teaserPlanes: string;
  teaserPlanesEtiqueta: string;
  teaserComoFunciona: string;
  teaserComoFuncionaEtiqueta: string;
  teaserAsistenteIa: string;
  teaserAsistenteIaEtiqueta: string;
  teaserQuienesSomos: string;
  teaserQuienesSomosEtiqueta: string;

  /**
   * Los textos que SUSTITUYEN a los de arriba cuando la prueba
   * gratuita no se ofrece (SE_OFRECE_PRUEBA de src/lib/web/oferta.ts).
   *
   * Van como un bloque aparte y no como un segundo diccionario entero
   * porque solo cambia una docena de frases: las que prometen la
   * prueba. El resto del guion —precios, módulos, objeciones— vale
   * igual. El componente mezcla este bloque encima del principal.
   *
   * Sus claves son un subconjunto de las de arriba, con el mismo tipo:
   * si alguien escribe aquí una clave que no existe, TypeScript lo para.
   */
  sinPrueba: Partial<Omit<TextosAsistente, "sinPrueba">>;
}

/**
 * Una clave de TEXTO del diccionario. Deja fuera `sinPrueba`, que no es
 * una frase sino el bloque de respaldo con el que se sustituyen unas
 * cuantas cuando la prueba gratuita no se ofrece.
 */
export type ClaveTexto = Exclude<keyof TextosAsistente, "sinPrueba">;

/** Todo lo que necesita saber el guion para contestar una vez. */
export interface Contexto {
  textos: TextosAsistente;
  config: ConfigAsistente;
  perfil: Perfil;
  /** La página de la app para personas: ahí puede escribir quien solo quiere reservar. */
  consumidor: boolean;
}

export type Variables = Record<string, string | number>;

/** Sustituye {clave} igual que el t() del panel, para no inventar otra sintaxis. */
export function interpolar(texto: string, vars?: Variables): string {
  if (!vars) return texto;
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

/* Primera en mayúscula y el resto en minúscula, igual que el cap() del
   original. OJO: baja todo lo demás, así que si algún día se rellenan
   los precios, «9 €/mes + IVA» se verá como «9 €/mes + iva». Es un fallo
   del original y se porta tal cual para no cambiar lo que se ve. */
export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const enlaceWa = (config: ConfigAsistente, texto: string) =>
  `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`;

/** Las variables que puede usar cualquier texto del asistente. */
function variables(ctx: Contexto, extra?: Variables): Variables {
  const { config, textos, perfil } = ctx;
  const precio = (v: string) => (v ? interpolar(textos.precioCon, { precio: v }) : textos.precioSin);
  const basic = precio(config.precioBasic);
  const pro = precio(config.precioPro);
  return {
    ...config.rutas,
    dias: config.diasPrueba,
    prueba: interpolar(textos.textoPrueba, { dias: config.diasPrueba }),
    tiendas: `[${textos.enlaceGooglePlay}](${config.rutas.playStore}) · [${textos.enlaceAppStore}](${config.rutas.appStore}) · [${textos.enlaceApk}](${config.rutas.apk})`,
    precioBasic: basic,
    precioPro: pro,
    precioBasicCap: capitalizar(basic),
    precioProCap: capitalizar(pro),
    email: config.email,
    soporteWa: enlaceWa(config, textos.soporteWaTexto),
    /* {nombre} es el del visitante; el del asistente va aparte para que
       no se pisen en los textos que llevan los dos. */
    nombre: perfil.nombre ?? "",
    nombreAsistente: textos.nombre,
    ...extra,
  };
}

/** Un texto del diccionario ya resuelto. Es el único camino a los textos. */
export function texto(ctx: Contexto, clave: ClaveTexto, extra?: Variables): string {
  return interpolar(ctx.textos[clave], variables(ctx, extra));
}

/** El «¡Hola!» con el nombre si se sabe, que es el saludo que repiten varias respuestas. */
function saludo(ctx: Contexto): string {
  return ctx.perfil.nombre
    ? texto(ctx, "holaNombre", { nombre: ctx.perfil.nombre })
    : texto(ctx, "hola");
}

/* ------------------------------------------------------------
   3. Markdown mínimo
   ------------------------------------------------------------
   El original montaba HTML a mano y lo inyectaba. Aquí se
   devuelve un árbol tipado y lo pinta React, así que no hace
   falta escapar nada ni usar dangerouslySetInnerHTML: sale el
   mismo DOM (<p>, <ul>, <li>, <b>, <a>, <br>) y las mismas
   clases de CSS siguen valiendo.
------------------------------------------------------------ */
export type Trozo =
  | { tipo: "texto"; texto: string }
  | { tipo: "negrita"; texto: string }
  | { tipo: "enlace"; texto: string; href: string; externo: boolean }
  | { tipo: "salto" };

export type Bloque =
  | { tipo: "parrafo"; trozos: Trozo[] }
  | { tipo: "lista"; puntos: Trozo[][] };

/* Negrita o enlace. Los destinos admitidos son los del original
   (http(s), mailto:, tel:, un .html de la web vieja o un archivo de
   descargas) más las rutas de Next, que empiezan por «/»: sin eso no
   se podría enlazar a /planes ni a /crear-cuenta?plan=pro. */
const RE_TROZO =
  /\*\*([^*]+)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+|\/[^\s)]*|[\w-]+\.html(?:\?[\w=&-]+)?(?:#[\w-]+)?|descargas\/[\w.-]+)\)/g;

/** Una línea suelta: lo que va dentro de un párrafo o de un punto de lista. */
export function parsearLinea(linea: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;
  for (const m of linea.matchAll(RE_TROZO)) {
    const i = m.index ?? 0;
    if (i > desde) trozos.push({ tipo: "texto", texto: linea.slice(desde, i) });
    if (m[1] !== undefined) trozos.push({ tipo: "negrita", texto: m[1] });
    else if (m[2] !== undefined && m[3] !== undefined) {
      trozos.push({ tipo: "enlace", texto: m[2], href: m[3], externo: /^https?:/.test(m[3]) });
    }
    desde = i + m[0].length;
  }
  if (desde < linea.length) trozos.push({ tipo: "texto", texto: linea.slice(desde) });
  return trozos;
}

/** El texto de un mensaje del bot, en bloques. */
export function parsearMarkdown(fuente: string): Bloque[] {
  const bloques: Bloque[] = [];
  let parrafo: string[] = [];
  let puntos: Trozo[][] = [];

  const cerrarParrafo = () => {
    if (!parrafo.length) return;
    const trozos: Trozo[] = [];
    parrafo.forEach((linea, i) => {
      if (i) trozos.push({ tipo: "salto" });
      trozos.push(...parsearLinea(linea));
    });
    bloques.push({ tipo: "parrafo", trozos });
    parrafo = [];
  };
  const cerrarLista = () => {
    if (!puntos.length) return;
    bloques.push({ tipo: "lista", puntos });
    puntos = [];
  };

  fuente.split("\n").forEach((cruda) => {
    const l = cruda.trim();
    if (/^[-•]\s+/.test(l)) {
      cerrarParrafo();
      puntos.push(parsearLinea(l.replace(/^[-•]\s+/, "")));
      return;
    }
    cerrarLista();
    if (!l) cerrarParrafo();
    else parrafo.push(l);
  });
  cerrarParrafo();
  cerrarLista();
  return bloques;
}

/* ------------------------------------------------------------
   4. Entender lo que escribe el visitante
------------------------------------------------------------ */

/* Los números escritos con letra, para que «somos tres» cuente igual
   que «somos 3». */
const NUMEROS: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100,
};

/**
 * Deja la frase en minúsculas, sin tildes, sin signos y rodeada de
 * espacios. Los espacios de los extremos son lo que permite buscar
 * palabras enteras con includes(" palabra ") sin que «app» encaje
 * dentro de «apple».
 */
export function normalizar(s: string): string {
  const limpio = String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9€%\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (NUMEROS[w] !== undefined ? String(NUMEROS[w]) : w))
    .join(" ");
  return ` ${limpio} `;
}

const tieneClave = (n: string, kw: string) => n.includes(` ${kw} `);

/** El primer número de la frase, con coma o con punto. */
export function primerNumero(n: string): number | null {
  const m = n.match(/(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

export type ClaveSector =
  | "estetica" | "peluqueria" | "salud" | "bienestar"
  | "tatuajes" | "construccion" | "tecnologia" | "servicios";

export type ClavePrioridad = "agenda" | "ausencias" | "cobros" | "equipo" | "ventas";

/** Lo que el asistente va sabiendo del visitante. */
export interface Perfil {
  sector?: ClaveSector;
  /** El discurso de su sector ya se ha contado: no repetirlo. */
  contado?: boolean;
  equipo?: number;
  sedes?: number;
  prioridad?: ClavePrioridad;
  nombre?: string;
  /** Código de país de money.ts, o "otro" cuando pide elegir moneda. */
  pais?: string;
  /** Segunda vuelta: el país o la moneda cuando el primero fue "otro". */
  pais2?: string;
  citas?: number;
  ticket?: number;
  /** Proporción de citas que se caen (0,2 = 2 de cada 10). */
  tasa?: number;
}

/* Sector reconocible y como se llama en el diccionario. El orden manda:
   gana el primero que encaje, igual que en el original. */
const SECTORES: Array<[ClaveSector, string[]]> = [
  ["estetica", ["estetica", "belleza", "unas", "manicura", "pedicura", "pestanas", "cejas", "depilacion", "maquillaje", "spa", "masajes", "masaje", "facial", "micropigmentacion", "nails", "lash"]],
  ["peluqueria", ["peluqueria", "peluquero", "peluquera", "barberia", "barbero", "salon", "colorista"]],
  ["salud", ["salud", "fisio", "fisioterapia", "fisioterapeuta", "clinica", "dental", "dentista", "psicologo", "psicologa", "psicologia", "nutricionista", "podologo", "podologia", "osteopata", "medico", "veterinaria", "veterinario", "logopeda"]],
  ["bienestar", ["gimnasio", "yoga", "pilates", "entrenador", "entrenadora", "crossfit", "danza"]],
  ["tatuajes", ["tatuaje", "tatuajes", "tattoo", "piercing"]],
  ["construccion", ["construccion", "reformas", "reforma", "obra", "obras", "fontanero", "electricista", "instalador", "arquitecto", "carpinteria"]],
  ["tecnologia", ["tecnologia", "software", "informatica", "reparacion", "reparaciones"]],
  ["servicios", ["academia", "clases", "abogado", "asesoria", "gestoria", "consultoria", "fotografo", "fotografia", "taller", "autoescuela", "servicios", "otro"]],
];

const NOMBRE_SECTOR: Record<ClaveSector, ClaveTexto> = {
  estetica: "nombreSectorEstetica",
  peluqueria: "nombreSectorPeluqueria",
  salud: "nombreSectorSalud",
  bienestar: "nombreSectorBienestar",
  tatuajes: "nombreSectorTatuajes",
  construccion: "nombreSectorConstruccion",
  tecnologia: "nombreSectorTecnologia",
  servicios: "nombreSectorServicios",
};

const PITCH_SECTOR: Record<ClaveSector, ClaveTexto> = {
  estetica: "pitchEstetica",
  peluqueria: "pitchPeluqueria",
  salud: "pitchSalud",
  bienestar: "pitchBienestar",
  tatuajes: "pitchTatuajes",
  construccion: "pitchConstruccion",
  tecnologia: "pitchTecnologia",
  servicios: "pitchServicios",
};

export type ClaveIntencion =
  | "apk" | "empresas_app" | "reservar" | "cancelar" | "gratis_app" | "descargar" | "soporte"
  | "demo" | "roi" | "recomendar" | "caro" | "precio" | "prueba" | "planes" | "permanencia"
  | "ya_uso" | "tiempo" | "whatsapp" | "ia" | "ausencias" | "pagos" | "crm" | "equipo" | "sedes"
  | "stock" | "estadisticas" | "resenas" | "comunicacion" | "automatizar" | "app" | "seguridad"
  | "idioma" | "quienes" | "funciona" | "reservas" | "que_es" | "gracias" | "saludo" | "despedida"
  | "sector" | "fallback";

/** Las intenciones que se contestan con un texto; las otras tres abren un flujo. */
export type ClaveRespuesta = Exclude<ClaveIntencion, "demo" | "roi" | "recomendar">;

/* Palabras por intención, en el mismo orden que el original (el orden
   solo importa para desempatar: gana la primera con mejor puntuación). */
const INTENCIONES: Array<[ClaveIntencion, string[]]> = [
  ["apk", ["apk", "sin google play", "sin play store", "no tengo google play", "no tengo play store", "huawei", "archivo apk", "instalar apk", "descargar apk", "descargar el apk", "hay apk"]],
  ["empresas_app", ["aparecer en la app", "aparezco en la app", "como aparezco", "salir en la app", "estar en la app", "aparecer en bookmy", "publicar mi negocio", "mi negocio en la app", "registrar mi negocio", "anunciar mi negocio", "tengo un negocio", "soy un negocio"]],
  ["reservar", ["como reservo", "quiero reservar", "reservar una cita", "pedir cita", "pedir una cita", "coger cita", "sacar cita", "hacer una reserva", "reservar un servicio"]],
  ["cancelar", ["cancelar mi cita", "cancelar una cita", "cancelar mi reserva", "cambiar mi cita", "cambiar la cita", "mover mi cita", "anular mi cita", "anular la cita"]],
  ["gratis_app", ["app es gratis", "app gratis", "cuesta la app", "pagar la app", "gratis la app", "la app cuesta"]],
  ["descargar", ["descargar", "descargo", "descarga", "bajar la app", "me la bajo", "instalar la app", "donde la descargo", "play store", "google play", "app store"]],
  ["soporte", ["soporte", "no puedo entrar", "no me deja", "contrasena", "olvide", "mi cuenta", "error", "no funciona", "incidencia", "ya soy cliente", "mi panel"]],
  ["demo", ["demo", "demostracion", "reunion", "llamada", "llamadme", "llamame", "que me llamen", "videollamada", "hablar con ventas", "hablar con alguien", "hablar con una persona", "persona", "humano", "asesor", "comercial", "agente", "contactar", "contacto"]],
  ["roi", ["cuanto pierdo", "pierdo dinero", "rentable", "rentabilidad", "retorno", "roi", "merece la pena", "vale la pena", "compensa", "calcular", "calculo"]],
  ["recomendar", ["que plan", "cual plan", "me recomiendas", "recomiendame", "recomendacion", "cual me conviene", "cual elijo", "cual elegir", "que me conviene"]],
  ["caro", ["caro", "muy caro", "presupuesto", "barato", "descuento", "oferta", "no me lo puedo permitir"]],
  ["precio", ["precio", "precios", "cuesta", "cuanto vale", "coste", "costo", "tarifa", "tarifas", "mensualidad", "cuota", "cuanto es", "cuanto cuesta"]],
  ["prueba", ["prueba", "probar", "trial", "7 dias", "dias gratis", "sin tarjeta", "periodo de prueba", "prueba gratis"]],
  ["planes", ["plan", "planes", "basic", "basico", "plan basic", "plan pro", "free", "gratis", "gratuito", "pro", "crm pro", "version", "diferencia", "comparar", "comparativa"]],
  ["permanencia", ["permanencia", "darme de baja", "dar de baja", "baja", "cancelar la suscripcion", "cancelar suscripcion", "contrato", "compromiso"]],
  ["ya_uso", ["ya uso", "ya tengo", "uso otra", "otra app", "otro programa", "otra herramienta", "vengo de", "cambiarme", "migrar", "migracion", "importar", "excel", "papel", "libreta", "cuaderno"]],
  ["tiempo", ["no tengo tiempo", "complicado", "dificil", "no se de tecnologia", "no soy de tecnologia", "lio", "tecnologico", "tecnologica"]],
  ["whatsapp", ["whatsapp", "me escriben", "me reservan por", "por telefono", "me llaman", "instagram", "dm"]],
  ["ia", ["ia", "inteligencia artificial", "asistente", "chatbot", "bot", "gpt", "vendedor", "vende solo"]],
  ["ausencias", ["no show", "no shows", "ausencias", "faltan", "no vienen", "no se presentan", "plantones", "plantan", "cancelaciones", "cancelan", "recordatorio", "recordatorios"]],
  ["pagos", ["pago", "pagos", "cobrar", "cobro", "cobros", "factura", "facturas", "facturacion", "tarjeta", "datafono", "senal", "deposito", "adelanto"]],
  ["crm", ["crm", "clientes", "ficha", "historial", "base de datos", "fidelizar", "fidelizacion", "repetir", "recurrentes"]],
  ["equipo", ["equipo", "empleados", "empleadas", "trabajadores", "personal", "profesionales", "roles", "horarios"]],
  ["sedes", ["sede", "sedes", "sucursal", "sucursales", "locales", "franquicia", "varios centros", "cadena"]],
  ["stock", ["stock", "inventario", "insumos", "productos", "almacen", "material"]],
  ["estadisticas", ["estadisticas", "informes", "reportes", "metricas", "dashboard", "kpi", "ingresos"]],
  ["resenas", ["resenas", "opiniones", "valoraciones", "reputacion", "estrellas", "reviews"]],
  ["comunicacion", ["comunicacion", "mensajes", "sms", "email", "correo", "campanas", "campana", "promociones", "marketing", "newsletter"]],
  ["automatizar", ["automatizar", "automatizacion", "automatizaciones", "automatico", "automaticos", "automaticamente"]],
  ["app", ["app", "aplicacion", "movil", "android", "iphone", "ios", "tablet"]],
  ["seguridad", ["seguridad", "seguro", "rgpd", "gdpr", "proteccion de datos", "privacidad", "lopd", "datos personales", "cifrado", "mis datos"]],
  ["idioma", ["ingles", "idioma", "idiomas", "english"]],
  ["quienes", ["quienes sois", "quien esta detras", "empresa", "sobre bookmy", "donde estais", "de donde sois", "ubicacion", "direccion"]],
  ["funciona", ["como funciona", "como empiezo", "como se usa", "pasos", "configurar", "configuracion", "empezar", "registrarme", "crear cuenta", "darme de alta"]],
  ["reservas", ["reserva", "reservas", "reservar", "cita", "citas", "agenda", "calendario", "turnos", "huecos", "disponibilidad", "perfil publico"]],
  ["que_es", ["que es bookmy", "que es", "que haceis", "que hace", "para que sirve", "funciones", "funcionalidades", "caracteristicas", "que incluye", "modulos", "que ofrece"]],
  ["gracias", ["gracias", "genial", "perfecto", "vale", "ok", "estupendo", "guay"]],
  ["saludo", ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal", "saludos"]],
  ["despedida", ["adios", "hasta luego", "chao", "nos vemos", "lo pienso", "me lo pienso"]],
];

/* Cortesía: no deben ganarle a una pregunta de verdad («hola, cuánto
   cuesta» tiene que contestar el precio, no el saludo). */
const BLANDAS: ClaveIntencion[] = ["gracias", "saludo", "despedida"];

/* Las palabras clave pasan por la misma normalización que el texto, para
   que «un» sea «1» a los dos lados de la comparación. */
const INTENCIONES_NORM: Array<[ClaveIntencion, string[]]> = INTENCIONES.map(([id, kws]) => [
  id,
  kws.map((k) => normalizar(k).trim()),
]);

/**
 * Qué está preguntando. Puntúa cada intención por las palabras que
 * encajan (las frases largas valen más) y las de cortesía solo ganan si
 * no hay ninguna otra. Sin nada reconocible, si ya se sabe el sector y
 * no se ha contado su discurso, se cuenta; si no, respuesta de reserva.
 */
export function detectarIntencion(n: string, perfil: Perfil): ClaveIntencion {
  let mejor: ClaveIntencion | null = null;
  let puntos = 0;
  let mejorDura: ClaveIntencion | null = null;
  let puntosDuros = 0;
  INTENCIONES_NORM.forEach(([id, kws]) => {
    let p = 0;
    kws.forEach((kw) => {
      if (tieneClave(n, kw)) p += kw.split(" ").length * 2 + (kw.length > 6 ? 1 : 0);
    });
    if (p > puntos) { mejor = id; puntos = p; }
    if (!BLANDAS.includes(id) && p > puntosDuros) { mejorDura = id; puntosDuros = p; }
  });
  if (mejorDura) return mejorDura;
  if (mejor) return mejor;
  return perfil.sector && !perfil.contado ? "sector" : "fallback";
}

/**
 * Saca del mensaje los datos que sirven para vender: sector, tamaño del
 * equipo, sedes y nombre. Devuelve un perfil nuevo para que el
 * componente no dependa de mutaciones.
 */
export function extraerPerfil(crudo: string, n: string, perfil: Perfil): Perfil {
  const p: Perfil = { ...perfil };
  for (const [clave, kws] of SECTORES) {
    if (kws.some((k) => tieneClave(n, k))) {
      /* Cambiar de sector obliga a volver a contar su discurso. */
      if (p.sector !== clave) { p.sector = clave; p.contado = false; }
      break;
    }
  }
  const equipo =
    n.match(/ (\d{1,3}) (?:empleados?|empleadas?|trabajador(?:es|as)?|personas|profesionales|companer[oa]s|chic[oa]s|esteticistas|peluquer[oa]s) /) ||
    n.match(/ somos (\d{1,3}) /);
  if (equipo) p.equipo = Number(equipo[1]);
  if (/ (solo yo|yo sola|yo solo|trabajo sola|trabajo solo|autonomo|autonoma|freelance) /.test(n)) p.equipo = 1;
  const sedes = n.match(/ (\d{1,2}) (?:sedes?|locales?|centros?|sucursales?|tiendas?|clinicas?|salones?) /);
  if (sedes) p.sedes = Number(sedes[1]);
  /* El nombre se busca en el texto crudo porque la normalización le
     quita las tildes y lo dejaría escrito mal. */
  const nombre = crudo.match(/\bme llamo\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]{2,20})/i);
  if (nombre) p.nombre = capitalizar(nombre[1]);
  return p;
}

/* ------------------------------------------------------------
   5. Chips (las respuestas rápidas)
------------------------------------------------------------ */
export type NombreFlujo = "recomendar" | "roi";

export type Accion =
  | { tipo: "intencion"; intencion: ClaveIntencion }
  | { tipo: "flujo"; flujo: NombreFlujo }
  | { tipo: "sector"; sector: ClaveSector }
  | { tipo: "equipo"; personas: number };

/** Valor que deja un paso de un flujo en el perfil. */
export type ValorPaso = number | string;

export interface Chip {
  etiqueta: string;
  accion?: Accion;
  /** Chip que es un enlace: se abre en otra pestaña y no sigue la conversación. */
  href?: string;
  /** Respuesta a un paso de un flujo. */
  valor?: ValorPaso;
  principal?: boolean;
}

export interface CatalogoChips {
  queEs: Chip;
  recomendar: Chip;
  roi: Chip;
  planes: Chip;
  trial: Chip;
  basic: Chip;
  descargar: Chip;
  reservar: Chip;
  negocio: Chip;
  demo: Chip;
  ia: Chip;
  funciona: Chip;
}

/** Los chips de siempre, ya traducidos. */
export function catalogoChips(ctx: Contexto): CatalogoChips {
  const t = (clave: ClaveTexto) => texto(ctx, clave);
  return {
    queEs: { etiqueta: t("chipQueEs"), accion: { tipo: "intencion", intencion: "que_es" } },
    recomendar: { etiqueta: t("chipRecomendar"), accion: { tipo: "flujo", flujo: "recomendar" } },
    roi: { etiqueta: t("chipRoi"), accion: { tipo: "flujo", flujo: "roi" } },
    planes: { etiqueta: t("chipPlanes"), accion: { tipo: "intencion", intencion: "precio" } },
    trial: { etiqueta: t("chipTrial"), href: ctx.config.rutas.altaPro, principal: true },
    basic: { etiqueta: t("chipBasic"), href: ctx.config.rutas.altaBasic },
    descargar: { etiqueta: t("chipDescargar"), accion: { tipo: "intencion", intencion: "descargar" } },
    reservar: { etiqueta: t("chipReservar"), accion: { tipo: "intencion", intencion: "reservar" } },
    negocio: { etiqueta: t("chipNegocio"), accion: { tipo: "intencion", intencion: "empresas_app" } },
    demo: { etiqueta: t("chipDemo"), accion: { tipo: "intencion", intencion: "demo" } },
    ia: { etiqueta: t("chipIa"), accion: { tipo: "intencion", intencion: "ia" } },
    funciona: { etiqueta: t("chipFunciona"), accion: { tipo: "intencion", intencion: "funciona" } },
  };
}

/** Los cuatro sectores que se ofrecen de entrada. */
function chipsSector(ctx: Contexto): Chip[] {
  const pares: Array<[ClaveTexto, ClaveSector]> = [
    ["chipSectorEstetica", "estetica"],
    ["chipSectorPeluqueria", "peluqueria"],
    ["chipSectorSalud", "salud"],
    ["chipSectorOtro", "servicios"],
  ];
  return pares.map(([clave, sector]) => ({
    etiqueta: texto(ctx, clave),
    accion: { tipo: "sector", sector },
  }));
}

/** Tamaño del equipo preguntado desde una respuesta (no desde el flujo). */
function chipsEquipo(ctx: Contexto): Chip[] {
  const pares: Array<[ClaveTexto, number]> = [
    ["opEquipoSolo", 1],
    ["opEquipoPocos", 3],
    ["opEquipoMedio", 10],
    ["opEquipoMuchos", 20],
  ];
  return pares.map(([clave, personas]) => ({
    etiqueta: texto(ctx, clave),
    accion: { tipo: "equipo", personas },
  }));
}

/** Los chips con los que se abre la conversación. */
export function chipsApertura(ctx: Contexto): Chip[] {
  const c = catalogoChips(ctx);
  return ctx.consumidor
    ? [c.reservar, c.descargar, c.negocio, c.demo]
    : [c.queEs, c.recomendar, c.roi, c.planes, c.demo];
}

/** Los dos chips del empujón de mitad de conversación. */
export function chipsEmpujon(ctx: Contexto): Chip[] {
  const c = catalogoChips(ctx);
  return [c.recomendar, c.demo];
}

/* ------------------------------------------------------------
   6. Respuestas guionizadas
------------------------------------------------------------ */
export interface RespuestaGuion {
  texto: string;
  chips: Chip[];
  /** El discurso del sector acaba de contarse: que el componente lo apunte. */
  sectorContado?: boolean;
}

const RESPUESTAS: Record<ClaveRespuesta, (ctx: Contexto) => RespuestaGuion> = {
  saludo: (ctx) => {
    const c = catalogoChips(ctx);
    return ctx.consumidor
      ? { texto: texto(ctx, "resSaludoConsumidor", { hola: saludo(ctx) }), chips: [c.reservar, c.descargar, c.negocio] }
      : { texto: texto(ctx, "resSaludoNegocio", { hola: saludo(ctx) }), chips: chipsSector(ctx) };
  },
  que_es: (ctx) => ({ texto: texto(ctx, "resQueEs"), chips: chipsSector(ctx) }),
  sector: (ctx) => {
    const sector = ctx.perfil.sector ?? "servicios";
    return {
      texto: texto(ctx, "resSector", { pitch: texto(ctx, PITCH_SECTOR[sector]) }),
      chips: chipsEquipo(ctx),
      sectorContado: true,
    };
  },
  precio: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resPrecio"), chips: [c.recomendar, c.trial, c.demo] };
  },
  /* En el original «planes» contesta exactamente lo mismo que «precio». */
  planes: (ctx) => RESPUESTAS.precio(ctx),
  prueba: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resPrueba"), chips: [c.trial, c.basic, c.demo] };
  },
  permanencia: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resPermanencia"), chips: [c.trial, c.planes] };
  },
  caro: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resCaro"), chips: [c.roi, c.basic, c.trial] };
  },
  ausencias: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resAusencias"), chips: [c.roi, c.planes] };
  },
  reservas: (ctx) => {
    if (ctx.consumidor) return RESPUESTAS.reservar(ctx);
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resReservas"), chips: [c.roi, c.recomendar, c.funciona] };
  },
  reservar: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resReservar"), chips: [c.descargar, c.negocio] };
  },
  cancelar: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resCancelar"), chips: [c.reservar, c.descargar] };
  },
  gratis_app: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resGratisApp"), chips: [c.reservar, c.negocio] };
  },
  descargar: (ctx) => {
    const c = catalogoChips(ctx);
    return {
      texto: texto(ctx, "resDescargar"),
      chips: ctx.consumidor ? [c.reservar, c.negocio] : [c.trial, c.queEs],
    };
  },
  apk: (ctx) => {
    const c = catalogoChips(ctx);
    return {
      texto: texto(ctx, "resApk"),
      chips: ctx.consumidor ? [c.reservar, c.negocio] : [c.trial, c.queEs],
    };
  },
  empresas_app: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resEmpresasApp"), chips: [c.recomendar, c.trial, c.demo] };
  },
  crm: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resCrm"), chips: [c.trial, c.ia, c.recomendar] };
  },
  pagos: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resPagos"), chips: [c.trial, c.recomendar] };
  },
  equipo: (ctx) => ({ texto: texto(ctx, "resEquipo"), chips: chipsEquipo(ctx) }),
  sedes: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resSedes"), chips: [c.trial, c.demo] };
  },
  stock: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resStock"), chips: [c.trial, c.recomendar] };
  },
  estadisticas: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resEstadisticas"), chips: [c.trial, c.recomendar] };
  },
  resenas: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resResenas"), chips: [c.ia, c.trial] };
  },
  comunicacion: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resComunicacion"), chips: [c.ia, c.trial] };
  },
  automatizar: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resAutomatizar"), chips: [c.roi, c.trial] };
  },
  ia: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resIa"), chips: [c.recomendar, c.trial, c.demo] };
  },
  app: (ctx) => {
    const c = catalogoChips(ctx);
    return ctx.consumidor
      ? { texto: texto(ctx, "resAppConsumidor"), chips: [c.reservar, c.negocio] }
      : { texto: texto(ctx, "resAppNegocio"), chips: [c.trial, c.recomendar] };
  },
  seguridad: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resSeguridad"), chips: [c.queEs, c.demo] };
  },
  ya_uso: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resYaUso"), chips: [c.trial, c.demo] };
  },
  tiempo: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resTiempo"), chips: [c.basic, c.demo, c.funciona] };
  },
  whatsapp: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resWhatsapp"), chips: [c.basic, c.roi] };
  },
  idioma: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resIdioma"), chips: [c.queEs, c.recomendar] };
  },
  quienes: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resQuienes"), chips: [c.demo, c.queEs] };
  },
  funciona: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resFunciona"), chips: [c.recomendar, c.basic, c.trial] };
  },
  soporte: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resSoporte"), chips: [c.queEs] };
  },
  gracias: (ctx) => {
    const c = catalogoChips(ctx);
    return {
      texto: texto(ctx, "resGracias"),
      chips: ctx.consumidor ? [c.descargar, c.negocio] : [c.trial, c.basic, c.demo],
    };
  },
  despedida: (ctx) => {
    const c = catalogoChips(ctx);
    return { texto: texto(ctx, "resDespedida"), chips: [c.demo, c.trial] };
  },
  fallback: (ctx) => {
    const c = catalogoChips(ctx);
    return ctx.consumidor
      ? { texto: texto(ctx, "resFallbackConsumidor"), chips: [c.reservar, c.descargar, c.negocio] }
      : { texto: texto(ctx, "resFallbackNegocio"), chips: [c.demo, c.queEs, c.planes] };
  },
};

/** Qué contestar a una intención de las que se resuelven con texto. */
export function responder(clave: ClaveRespuesta, ctx: Contexto): RespuestaGuion {
  const f = RESPUESTAS[clave];
  return f ? f(ctx) : RESPUESTAS.fallback(ctx);
}

/** Las tres intenciones que no se contestan: abren un flujo o el formulario. */
export function esIntencionGuiada(clave: ClaveIntencion): clave is "demo" | "roi" | "recomendar" {
  return clave === "demo" || clave === "roi" || clave === "recomendar";
}

/* ------------------------------------------------------------
   7. Los dos flujos guiados
------------------------------------------------------------ */
export type ClavePaso = "equipo" | "sedes" | "prioridad" | "pais" | "pais2" | "citas" | "ticket" | "tasa";

export interface OpcionPaso {
  etiqueta: string;
  valor: ValorPaso;
}

export interface PasoFlujo {
  clave: ClavePaso;
  pregunta: string;
  opciones: OpcionPaso[];
  /** Lee la respuesta escrita a mano. null = no se ha entendido. */
  leer: (n: string, crudo: string) => ValorPaso | null;
  /** Qué decir cuando no se ha entendido (si el paso admite repetirse). */
  reintento?: string;
  /** El paso no aplica con este perfil. */
  saltar?: boolean;
}

export interface EstadoFlujo {
  nombre: NombreFlujo;
  paso: number;
}

/** El país con el que se hacen las cuentas: el elegido, o su moneda si dijo «otro país». */
export function paisDelRoi(perfil: Perfil): PaisMoneda {
  const code = perfil.pais === "otro" ? perfil.pais2 : perfil.pais;
  return pais(code || "es");
}

/* Los ocho países de cabecera, con el probable delante para que no tenga
   que buscarse, y «otro país» al final. */
function opcionesPais(ctx: Contexto): OpcionPaso[] {
  const principales = ["es", "mx", "co", "ar", "cl", "pe", "ec", "us"];
  const probable = paisProbable();
  const orden = principales.includes(probable)
    ? [probable, ...principales.filter((c) => c !== probable)]
    : principales;
  return [
    ...orden.map((c) => ({ etiqueta: pais(c).name, valor: c })),
    { etiqueta: texto(ctx, "opOtroPais"), valor: "otro" },
  ];
}

/* Segunda vuelta: o la moneda a secas, o los países que más se escriben
   como «otro». Los nombres salen de money.ts para no repetir la tabla. */
function opcionesMoneda(ctx: Contexto): OpcionPaso[] {
  return [
    { etiqueta: texto(ctx, "opEuros"), valor: "eu" },
    { etiqueta: texto(ctx, "opDolares"), valor: "usd" },
    ...["ve", "do", "gt", "cr"].map((c) => ({ etiqueta: pais(c).name, valor: c })),
  ];
}

/**
 * Los pasos del flujo con el perfil de ahora mismo: la pregunta del
 * ticket lleva el nombre de la moneda y los importes de ejemplo salen del
 * país elegido, así que se recalculan en cada pregunta.
 */
export function pasosDelFlujo(nombre: NombreFlujo, ctx: Contexto): PasoFlujo[] {
  const t = (clave: ClaveTexto, extra?: Variables) => texto(ctx, clave, extra);
  if (nombre === "recomendar") {
    return [
      {
        clave: "equipo",
        pregunta: t("pasoEquipo"),
        opciones: [
          { etiqueta: t("opEquipoSolo"), valor: 1 },
          { etiqueta: t("opEquipoPocos"), valor: 3 },
          { etiqueta: t("opEquipoMedio"), valor: 10 },
          { etiqueta: t("opEquipoMuchos"), valor: 20 },
        ],
        leer: (n) => (/ (solo|sola|yo) /.test(n) ? 1 : primerNumero(n)),
      },
      {
        clave: "sedes",
        pregunta: t("pasoSedes"),
        opciones: [
          { etiqueta: t("opSedesUna"), valor: 1 },
          { etiqueta: t("opSedesPocas"), valor: 2 },
          { etiqueta: t("opSedesMuchas"), valor: 4 },
        ],
        leer: (n) => primerNumero(n),
      },
      {
        clave: "prioridad",
        pregunta: t("pasoPrioridad"),
        opciones: [
          { etiqueta: t("opPrioridadAgenda"), valor: "agenda" },
          { etiqueta: t("opPrioridadAusencias"), valor: "ausencias" },
          { etiqueta: t("opPrioridadCobros"), valor: "cobros" },
          { etiqueta: t("opPrioridadEquipo"), valor: "equipo" },
          { etiqueta: t("opPrioridadVentas"), valor: "ventas" },
        ],
        leer: (n) =>
          / (falt|ausenc|no vien|recordat)/.test(n) ? "ausencias"
            : / (cobr|factur|pago)/.test(n) ? "cobros"
              : / (equipo|sede|emplead)/.test(n) ? "equipo"
                : / (vend|ventas|ingres|factur)/.test(n) ? "ventas"
                  : / (reserv|agenda|cita)/.test(n) ? "agenda"
                    : null,
      },
    ];
  }
  const p = paisDelRoi(ctx.perfil);
  return [
    {
      clave: "pais",
      pregunta: t("pasoPais"),
      opciones: opcionesPais(ctx),
      /* «Otro» solo vale si de verdad no se reconoce ningún país en la
         frase, para que «otro, Colombia» elija Colombia. */
      leer: (n, crudo) => (/ otro /.test(n) && !reconocerPais(crudo) ? "otro" : reconocerPais(crudo)),
      reintento: t("reintentoPais"),
    },
    {
      clave: "pais2",
      pregunta: t("pasoMoneda"),
      opciones: opcionesMoneda(ctx),
      leer: (_n, crudo) => reconocerPais(crudo),
      reintento: t("reintentoMoneda"),
      saltar: ctx.perfil.pais !== "otro",
    },
    {
      clave: "citas",
      pregunta: t("pasoCitas"),
      opciones: [20, 50, 100, 200].map((v) => ({ etiqueta: String(v), valor: v })),
      leer: (n) => primerNumero(n),
    },
    {
      clave: "ticket",
      pregunta: t("pasoTicket", { moneda: p.curName }),
      opciones: p.chips.map((v) => ({ etiqueta: formatearDinero(v, p.code), valor: v })),
      leer: (_n, crudo) => leerImporte(crudo),
    },
    {
      clave: "tasa",
      pregunta: t("pasoTasa"),
      opciones: [
        { etiqueta: t("opTasaCasiNinguna"), valor: 0.05 },
        { etiqueta: "1", valor: 0.1 },
        { etiqueta: "2", valor: 0.2 },
        { etiqueta: t("opTasaMuchas"), valor: 0.3 },
      ],
      /* Se admite «2», «2 de cada 10» y «20%»; más de 10 no es una
         proporción creíble y se trata como no entendido. */
      leer: (n) => {
        if (/ (ninguna|casi ninguna) /.test(n)) return 0.05;
        const v = primerNumero(n);
        if (v == null) return null;
        return n.includes("%") ? v / 100 : v <= 10 ? v / 10 : null;
      },
    },
  ];
}

/** El texto con el que arranca cada flujo. */
export function introFlujo(nombre: NombreFlujo, ctx: Contexto): string {
  return texto(ctx, nombre === "recomendar" ? "flujoRecomendarIntro" : "flujoRoiIntro");
}

/** Lo que ya contestó el visitante para ese paso (el flujo de recomendar no repregunta). */
export function respuestaDePaso(perfil: Perfil, clave: ClavePaso): ValorPaso | undefined {
  switch (clave) {
    case "equipo": return perfil.equipo;
    case "sedes": return perfil.sedes;
    case "prioridad": return perfil.prioridad;
    case "pais": return perfil.pais;
    case "pais2": return perfil.pais2;
    case "citas": return perfil.citas;
    case "ticket": return perfil.ticket;
    case "tasa": return perfil.tasa;
    default: return undefined;
  }
}

const PRIORIDADES: ClavePrioridad[] = ["agenda", "ausencias", "cobros", "equipo", "ventas"];

/** Guarda la respuesta de un paso en el perfil, cada una con su tipo. */
export function guardarPaso(perfil: Perfil, clave: ClavePaso, valor: ValorPaso): Perfil {
  const p: Perfil = { ...perfil };
  const numero = typeof valor === "number" ? valor : primerNumero(normalizar(valor));
  switch (clave) {
    case "equipo": if (numero != null) p.equipo = numero; break;
    case "sedes": if (numero != null) p.sedes = numero; break;
    case "citas": if (numero != null) p.citas = numero; break;
    case "ticket": if (numero != null) p.ticket = numero; break;
    case "tasa": if (numero != null) p.tasa = numero; break;
    case "prioridad":
      if (typeof valor === "string" && (PRIORIDADES as string[]).includes(valor)) {
        p.prioridad = valor as ClavePrioridad;
      }
      break;
    case "pais": if (typeof valor === "string") p.pais = valor; break;
    case "pais2": if (typeof valor === "string") p.pais2 = valor; break;
  }
  return p;
}

/** Vuelve a preguntar la cuenta de las ausencias desde cero. */
export function olvidarRoi(perfil: Perfil): Perfil {
  const p: Perfil = { ...perfil };
  delete p.pais;
  delete p.pais2;
  delete p.citas;
  delete p.ticket;
  delete p.tasa;
  return p;
}

/** Nombre de flujo que llega de fuera (data-assistant-flow, API global). */
export function interpretarFlujo(valor: string): NombreFlujo | null {
  return valor === "recomendar" || valor === "roi" ? valor : null;
}

/* ------------------------------------------------------------
   8. Recomendación de plan y cuenta de las ausencias
------------------------------------------------------------ */
export type ClaveMotivo =
  | "motivoEquipo" | "motivoSedes" | "motivoAusencias" | "motivoCobros" | "motivoVentas"
  | "motivoEquipoSolo" | "motivoEstadisticas" | "motivoReservas" | "motivoConfirmaciones"
  | "motivoMovil" | "motivoCrecer";

export interface Recomendacion {
  pro: boolean;
  /** Como mucho cuatro motivos: los que caben en la tarjeta. */
  motivos: ClaveMotivo[];
}

/**
 * La regla del original: Basic solo para quien trabaja solo, en una sede
 * y cuyo problema es (o no hay, o es) recibir reservas. Todo lo demás
 * pide Pro.
 */
export function recomendarPlan(perfil: Perfil): Recomendacion {
  const equipo = Number(perfil.equipo || 1);
  const sedes = Number(perfil.sedes || 1);
  const prioridad = perfil.prioridad;
  const pro = !(equipo <= 1 && sedes <= 1 && (!prioridad || prioridad === "agenda"));
  const motivos: ClaveMotivo[] = [];
  if (pro) {
    if (equipo > 1) motivos.push("motivoEquipo");
    if (sedes > 1) motivos.push("motivoSedes");
    if (prioridad === "ausencias") motivos.push("motivoAusencias");
    if (prioridad === "cobros") motivos.push("motivoCobros");
    if (prioridad === "ventas") motivos.push("motivoVentas");
    /* Solo cuando trabaja solo: si hay equipo, ya se dijo arriba. */
    if (prioridad === "equipo" && equipo <= 1) motivos.push("motivoEquipoSolo");
    motivos.push("motivoEstadisticas");
  } else {
    motivos.push("motivoReservas", "motivoConfirmaciones", "motivoMovil", "motivoCrecer");
  }
  return { pro, motivos: motivos.slice(0, 4) };
}

/** Lo que se dice antes de enseñar la tarjeta del plan. */
export function introRecomendacion(ctx: Contexto, pro: boolean): string {
  if (!pro) return texto(ctx, "recBasic");
  const sector = ctx.perfil.sector;
  return sector
    ? texto(ctx, "recProSector", { sector: texto(ctx, NOMBRE_SECTOR[sector]) })
    : texto(ctx, "recPro");
}

/** Lo que se dice después de la tarjeta del plan. */
export function cierreRecomendacion(ctx: Contexto, pro: boolean): string {
  return texto(ctx, pro ? "recProCierre" : "recBasicCierre");
}

/** Los chips de después de recomendar. */
export function chipsRecomendacion(ctx: Contexto, pro: boolean): Chip[] {
  const c = catalogoChips(ctx);
  return pro ? [c.trial, c.demo, c.roi] : [c.basic, c.trial, c.roi];
}

export interface CalculoRoi {
  /** Citas al mes que no se presentan. 4,33 semanas por mes. */
  citasPerdidas: number;
  perdidaMes: number;
  /** Lo que se recupera si solo se evita 1 de cada 3. */
  recuperaMes: number;
  recuperaAnio: number;
}

/** La cuenta de las ausencias. null si todavía faltan datos. */
export function calcularRoi(perfil: Perfil): CalculoRoi | null {
  const { citas, ticket, tasa } = perfil;
  if (citas == null || ticket == null || tasa == null) return null;
  const perdidaMes = citas * 4.33 * ticket * tasa;
  const recuperaMes = perdidaMes / 3;
  return {
    citasPerdidas: Math.round(citas * 4.33 * tasa),
    perdidaMes,
    recuperaMes,
    recuperaAnio: recuperaMes * 12,
  };
}

/* ------------------------------------------------------------
   9. Captación de contactos
------------------------------------------------------------ */
export interface Lead {
  nombre: string;
  email: string;
  telefono: string;
  /** Tipo de empresa tal como se ve en el desplegable. */
  tipo: string;
}

/** Los tipos de empresa del desplegable, en orden. */
export const TIPOS_EMPRESA: ClaveTexto[] = [
  "tipoSalud", "tipoEstetica", "tipoConstruccion", "tipoTecnologia", "tipoServicios", "tipoOtros",
];

/* Si ya se sabe el sector, el desplegable viene elegido. */
const TIPO_POR_SECTOR: Record<ClaveSector, ClaveTexto> = {
  estetica: "tipoEstetica",
  peluqueria: "tipoEstetica",
  salud: "tipoSalud",
  bienestar: "tipoServicios",
  tatuajes: "tipoServicios",
  construccion: "tipoConstruccion",
  tecnologia: "tipoTecnologia",
  servicios: "tipoServicios",
};

/** El tipo de empresa que toca de salida, ya traducido ("" si no se sabe). */
export function tipoPorDefecto(ctx: Contexto): string {
  const sector = ctx.perfil.sector;
  return sector ? texto(ctx, TIPO_POR_SECTOR[sector]) : "";
}

/**
 * El recado que se le manda al equipo por WhatsApp o correo. Lleva lo
 * que el visitante ha contado para que nadie tenga que volver a
 * preguntárselo.
 */
export function resumenLead(ctx: Contexto, lead: Lead): string {
  const p = ctx.perfil;
  const trozos = [
    texto(ctx, "resumenHola", {
      nombre: lead.nombre,
      tipo: lead.tipo ? ` (${lead.tipo})` : "",
    }),
  ];
  if (p.equipo) {
    trozos.push(texto(ctx, "resumenEquipo", {
      equipo: p.equipo === 1 ? texto(ctx, "resumenSolo") : texto(ctx, "resumenPersonas", { n: p.equipo }),
    }));
  }
  if (p.sedes) trozos.push(texto(ctx, "resumenSedes", { n: p.sedes }));
  if (p.prioridad) trozos.push(texto(ctx, "resumenPrioridad", { prioridad: p.prioridad }));
  if (lead.email || lead.telefono) {
    trozos.push(texto(ctx, "resumenContacto", {
      contacto: [lead.email, lead.telefono].filter(Boolean).join(" · "),
    }));
  }
  return trozos.join(" ");
}

/** El enlace de WhatsApp con el recado dentro. */
export function enlaceWhatsapp(config: ConfigAsistente, mensaje: string): string {
  return enlaceWa(config, mensaje);
}

/** El enlace de correo con asunto y cuerpo. */
export function enlaceCorreo(config: ConfigAsistente, asunto: string, cuerpo: string): string {
  return `mailto:${config.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/**
 * El perfil con los nombres que esperan los dos endpoints del original
 * (api/asistente.php solo deja pasar estas claves). Se conserva el
 * contrato para que quien implemente el endpoint en Next pueda
 * reutilizar el prompt tal cual.
 */
export function perfilParaApi(ctx: Contexto): Record<string, string | number | boolean> {
  const p = ctx.perfil;
  const datos: Record<string, string | number | boolean> = {};
  if (p.sector) { datos.sector = p.sector; datos.sectorLabel = texto(ctx, NOMBRE_SECTOR[p.sector]); }
  if (p.contado !== undefined) datos.pitched = p.contado;
  if (p.equipo !== undefined) datos.team = p.equipo;
  if (p.sedes !== undefined) datos.sedes = p.sedes;
  if (p.prioridad) datos.pain = p.prioridad;
  if (p.nombre) datos.name = p.nombre;
  if (p.pais) datos.pais = p.pais;
  if (p.pais2) datos.pais2 = p.pais2;
  if (p.citas !== undefined) datos.citas = p.citas;
  if (p.ticket !== undefined) datos.ticket = p.ticket;
  if (p.tasa !== undefined) datos.rate = p.tasa;
  return datos;
}

/* ------------------------------------------------------------
   10. Sugerencia flotante según la página
------------------------------------------------------------ */
export interface Teaser {
  texto: string;
  etiqueta: string;
  accion: Accion;
}

/* Clave de la página (el data-page del original) → qué ofrecer. */
const TEASERS: Record<string, { texto: ClaveTexto; etiqueta: ClaveTexto; accion: Accion }> = {
  crm: { texto: "teaserCrm", etiqueta: "teaserCrmEtiqueta", accion: { tipo: "flujo", flujo: "roi" } },
  app: { texto: "teaserApp", etiqueta: "teaserAppEtiqueta", accion: { tipo: "intencion", intencion: "reservar" } },
  "app-empresas": { texto: "teaserAppEmpresas", etiqueta: "teaserAppEmpresasEtiqueta", accion: { tipo: "intencion", intencion: "empresas_app" } },
  "plan-basic": { texto: "teaserPlanBasic", etiqueta: "teaserPlanBasicEtiqueta", accion: { tipo: "flujo", flujo: "recomendar" } },
  "plan-pro": { texto: "teaserPlanPro", etiqueta: "teaserPlanProEtiqueta", accion: { tipo: "flujo", flujo: "roi" } },
  planes: { texto: "teaserPlanes", etiqueta: "teaserPlanesEtiqueta", accion: { tipo: "flujo", flujo: "recomendar" } },
  "como-funciona": { texto: "teaserComoFunciona", etiqueta: "teaserComoFuncionaEtiqueta", accion: { tipo: "intencion", intencion: "funciona" } },
  "asistente-ia": { texto: "teaserAsistenteIa", etiqueta: "teaserAsistenteIaEtiqueta", accion: { tipo: "intencion", intencion: "ia" } },
  "quienes-somos": { texto: "teaserQuienesSomos", etiqueta: "teaserQuienesSomosEtiqueta", accion: { tipo: "intencion", intencion: "demo" } },
};

/** La sugerencia de esta página, o null si esta página no tiene. */
export function teaserDePagina(pagina: string, ctx: Contexto): Teaser | null {
  const t = TEASERS[pagina];
  if (!t) return null;
  return { texto: texto(ctx, t.texto), etiqueta: texto(ctx, t.etiqueta), accion: t.accion };
}

/* ------------------------------------------------------------
   11. El estado de la conversación
   ------------------------------------------------------------
   Se guarda en el navegador para que la conversación siga igual al
   cambiar de página. Las tarjetas se guardan como datos (no como
   HTML, que es lo que hacía el original) para poder volver a
   pintarlas en el idioma y la moneda de ahora.
------------------------------------------------------------ */
export type Mensaje =
  | { de: "bot"; texto: string }
  | { de: "usuario"; texto: string }
  | { de: "plan"; pro: boolean; motivos: ClaveMotivo[] }
  | { de: "roi"; pais: string; citas: number; ticket: number; tasa: number }
  | { de: "envio"; resumen: string }
  /* El formulario de contacto no se guarda: el original tampoco lo
     guardaba, así que al recargar desaparece. Lleva id porque pueden
     quedar dos abiertos (el visitante escribe su correo dos veces) y al
     enviar uno solo se retira ese, como hacía el original. */
  | { de: "formulario"; id: string; nombre: string; email: string; telefono: string };

export type MensajeTexto = Extract<Mensaje, { texto: string }>;

export const esMensajeTexto = (m: Mensaje): m is MensajeTexto => m.de === "bot" || m.de === "usuario";

export interface EstadoChat {
  mensajes: Mensaje[];
  chips: Chip[];
  perfil: Perfil;
  flujo: EstadoFlujo | null;
  /** Mensajes del visitante: a partir del cuarto se le ofrece la recomendación. */
  turnos: number;
  /** Ya dejó sus datos. */
  lead: boolean;
  /** Ya se le dio el empujón de la recomendación. */
  empujado: boolean;
  /** Ya abrió el asistente alguna vez (no se vuelve a saludar). */
  yaAbierto: boolean;
}

export function estadoVacio(): EstadoChat {
  return { mensajes: [], chips: [], perfil: {}, flujo: null, turnos: 0, lead: false, empujado: false, yaAbierto: false };
}

/* Lo que venga del almacenamiento es texto de fuera: se comprueba pieza
   a pieza y lo que no encaje se tira, que es mejor que romper el chat. */
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function sanearMensaje(v: unknown): Mensaje | null {
  if (!esObjeto(v)) return null;
  const de = v.de;
  if ((de === "bot" || de === "usuario") && typeof v.texto === "string") return { de, texto: v.texto };
  if (de === "plan" && typeof v.pro === "boolean" && Array.isArray(v.motivos)) {
    return { de, pro: v.pro, motivos: v.motivos.filter((m): m is ClaveMotivo => typeof m === "string") };
  }
  if (de === "roi" && typeof v.pais === "string" && typeof v.citas === "number"
    && typeof v.ticket === "number" && typeof v.tasa === "number") {
    return { de, pais: v.pais, citas: v.citas, ticket: v.ticket, tasa: v.tasa };
  }
  if (de === "envio" && typeof v.resumen === "string") return { de, resumen: v.resumen };
  return null;
}

function sanearAccion(v: unknown): Accion | null {
  if (!esObjeto(v)) return null;
  if (v.tipo === "intencion" && typeof v.intencion === "string"
    && INTENCIONES.some(([id]) => id === v.intencion)) {
    return { tipo: "intencion", intencion: v.intencion as ClaveIntencion };
  }
  if (v.tipo === "flujo" && typeof v.flujo === "string") {
    const flujo = interpretarFlujo(v.flujo);
    return flujo ? { tipo: "flujo", flujo } : null;
  }
  if (v.tipo === "sector" && typeof v.sector === "string" && SECTORES.some(([k]) => k === v.sector)) {
    return { tipo: "sector", sector: v.sector as ClaveSector };
  }
  if (v.tipo === "equipo" && typeof v.personas === "number") return { tipo: "equipo", personas: v.personas };
  return null;
}

function sanearChip(v: unknown): Chip | null {
  if (!esObjeto(v) || typeof v.etiqueta !== "string") return null;
  const chip: Chip = { etiqueta: v.etiqueta };
  if (typeof v.href === "string") chip.href = v.href;
  if (typeof v.valor === "string" || typeof v.valor === "number") chip.valor = v.valor;
  if (v.principal === true) chip.principal = true;
  const accion = sanearAccion(v.accion);
  if (accion) chip.accion = accion;
  return chip;
}

function sanearPerfil(v: unknown): Perfil {
  if (!esObjeto(v)) return {};
  const p: Perfil = {};
  const numero = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  if (typeof v.sector === "string" && SECTORES.some(([k]) => k === v.sector)) p.sector = v.sector as ClaveSector;
  if (typeof v.contado === "boolean") p.contado = v.contado;
  p.equipo = numero(v.equipo);
  p.sedes = numero(v.sedes);
  p.citas = numero(v.citas);
  p.ticket = numero(v.ticket);
  p.tasa = numero(v.tasa);
  if (typeof v.prioridad === "string" && (PRIORIDADES as string[]).includes(v.prioridad)) {
    p.prioridad = v.prioridad as ClavePrioridad;
  }
  if (typeof v.nombre === "string") p.nombre = v.nombre;
  if (typeof v.pais === "string" && (v.pais === "otro" || PAISES.some((c) => c.code === v.pais))) p.pais = v.pais;
  if (typeof v.pais2 === "string" && PAISES.some((c) => c.code === v.pais2)) p.pais2 = v.pais2;
  return p;
}

/** Reconstruye el estado guardado; si no hay nada aprovechable, arranca limpio. */
export function sanearEstado(v: unknown): EstadoChat {
  if (!esObjeto(v)) return estadoVacio();
  const base = estadoVacio();
  const mensajes = Array.isArray(v.mensajes)
    ? v.mensajes.map(sanearMensaje).filter((m): m is Mensaje => m !== null)
    : base.mensajes;
  const chips = Array.isArray(v.chips)
    ? v.chips.map(sanearChip).filter((c): c is Chip => c !== null)
    : base.chips;
  let flujo: EstadoFlujo | null = null;
  if (esObjeto(v.flujo) && typeof v.flujo.nombre === "string" && typeof v.flujo.paso === "number") {
    const nombre = interpretarFlujo(v.flujo.nombre);
    if (nombre) flujo = { nombre, paso: v.flujo.paso };
  }
  return {
    mensajes,
    chips,
    perfil: sanearPerfil(v.perfil),
    flujo,
    turnos: typeof v.turnos === "number" ? v.turnos : 0,
    lead: v.lead === true,
    empujado: v.empujado === true,
    yaAbierto: v.yaAbierto === true,
  };
}
