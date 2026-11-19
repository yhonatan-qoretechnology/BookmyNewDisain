/* ============================================================
   /api/asistente · el cerebro del asistente vendedor
   ------------------------------------------------------------
   Puerto de api/asistente.php del paquete original. El chat de la
   web manda aquí la conversación y aquí se le pregunta al modelo,
   para que LA CLAVE NO LLEGUE NUNCA AL NAVEGADOR: eso es lo único
   que este archivo tiene que hacer bien por encima de todo.

   NACE APAGADO, Y ESO ES A PROPÓSITO
   Sin ANTHROPIC_API_KEY en el entorno no hay IA: el GET contesta
   que no está configurado y el widget se queda con su guion, que
   está escrito entero en lib/web/asistente/guion.ts. Para
   encenderlo basta poner la variable en Seenode y reiniciar la
   aplicación: NO hace falta volver a desplegar, porque esto se lee
   en caliente en cada petición. Para apagarlo, se quita.

   POR QUÉ HAY UN GET
   El widget enseña textos distintos según si habla con una IA o
   con el guion («responde una IA» vs «respuestas preparadas», la
   etiqueta IA, el aviso legal del pie). Si le pasáramos el
   endpoint siempre, PRESUMIRÍA de IA mientras responde con el
   guion, que es mentirle al visitante. Así que el cliente pregunta
   primero, en una petición de 30 bytes, y solo se anuncia como IA
   si de verdad hay una detrás.

   LOS CUATRO CANDADOS, PORQUE ESTO ES UNA PUERTA PÚBLICA A UN
   MODELO QUE SE PAGA POR USO
     1. Origen: solo responde a peticiones de la propia web.
     2. Límite por visitante: 30 mensajes cada 10 minutos.
     3. Tope global del día: un visitante no puede, pero mil sí
        podrían dejar una factura. El PHP no lo tenía porque vivía
        en un hosting compartido con su propio límite; aquí no hay
        nada que nos frene, así que lo ponemos nosotros.
     4. Recorte de la conversación: 14 mensajes y 1.200 caracteres
        por mensaje, como el original.

   Los contadores viven en memoria y se van al reiniciar. Es lo que
   había (el PHP usaba un archivo en /tmp) y para un solo contenedor
   basta; si algún día la aplicación escala a varias copias, cada
   una tendrá su propia cuenta y habrá que llevarlos fuera.
============================================================ */
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { construirPrompt } from "@/lib/web/asistente/prompt";

/* Nunca se prerenderiza ni se guarda en caché: la respuesta depende
   del cuerpo de la petición y de una variable de entorno que puede
   cambiar sin volver a construir. */
export const dynamic = "force-dynamic";

/** Últimos mensajes que se le mandan al modelo. */
const MAX_MENSAJES = 14;
/** Caracteres por mensaje. */
const MAX_CARACTERES = 1200;
/** Mensajes por visitante… */
const LIMITE_VISITANTE = 30;
/** …cada diez minutos. */
const VENTANA_MS = 10 * 60 * 1000;
/** Tope de respuestas del modelo por día, para toda la web. */
const TOPE_DIARIO = Number(process.env.BOOKMY_AI_TOPE_DIARIO ?? 500);

const MODELO_POR_DEFECTO = "claude-haiku-5-5";
const MAX_TOKENS = 700;
const TIEMPO_MAXIMO_MS = 25_000;

/* ------------------------------------------------------------
   Quién puede llamar
   ------------------------------------------------------------
   El original traía la lista de bookmy.es escrita a mano. Aquí se
   acepta además el propio host de la petición, porque la misma
   aplicación se sirve hoy en bookmynewdisain.seenode.app y mañana
   en bookmy.es, y una lista fija dejaría el asistente muerto al
   cambiar de dominio sin que nadie entendiera por qué.
------------------------------------------------------------ */
const ORIGENES_FIJOS = ["https://bookmy.es", "https://www.bookmy.es"];

const origenesPermitidos = (): string[] => {
  const extra = (process.env.BOOKMY_AI_ORIGENES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...ORIGENES_FIJOS, ...extra];
};

const origenValido = (origen: string, host: string | null): boolean => {
  /* Sin cabecera Origin: es una petición del mismo documento (o un
     cliente que no la manda). El original también lo dejaba pasar. */
  if (!origen) return true;
  if (origenesPermitidos().includes(origen)) return true;
  try {
    return Boolean(host) && new URL(origen).host === host;
  } catch {
    return false;
  }
};

/* ------------------------------------------------------------
   Contadores
------------------------------------------------------------ */
const visitas = new Map<string, number[]>();
let delDia = { dia: "", cuenta: 0 };

/** El visitante, sin guardar su IP: un hash que además cambia cada día. */
const huella = (req: Request): string => {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim()
    || req.headers.get("x-real-ip")
    || "0";
  return createHash("sha256").update(`${ip}|${hoy()}`).digest("hex").slice(0, 32);
};

const hoy = (): string => new Date().toISOString().slice(0, 10);

/** true si este visitante se ha pasado del límite. */
const demasiado = (clave: string): boolean => {
  const ahora = Date.now();
  const previas = (visitas.get(clave) ?? []).filter((t) => t > ahora - VENTANA_MS);
  if (previas.length >= LIMITE_VISITANTE) {
    visitas.set(clave, previas);
    return true;
  }
  previas.push(ahora);
  visitas.set(clave, previas);
  /* Limpieza perezosa: sin esto el mapa crece con cada visitante del
     día y no se vacía hasta el reinicio. */
  if (visitas.size > 5000) {
    for (const [k, v] of visitas) {
      if (!v.some((t) => t > ahora - VENTANA_MS)) visitas.delete(k);
    }
  }
  return false;
};

/** true si la web entera ha gastado el cupo del día. */
const topeDelDiaGastado = (): boolean => {
  const d = hoy();
  if (delDia.dia !== d) delDia = { dia: d, cuenta: 0 };
  return delDia.cuenta >= TOPE_DIARIO;
};

/* ------------------------------------------------------------
   Limpieza de la conversación
   ------------------------------------------------------------
   Igual que el PHP: se quitan las etiquetas, se recorta, se juntan
   los mensajes seguidos del mismo papel y la conversación tiene que
   empezar por el visitante y acabar por él. La API de mensajes
   rechaza dos turnos del mismo papel seguidos.
------------------------------------------------------------ */
interface Mensaje { role: "user" | "assistant"; content: string }

const limpiarConversacion = (crudos: unknown[]): Mensaje[] => {
  const msgs: Mensaje[] = [];
  for (const m of crudos.slice(-MAX_MENSAJES)) {
    if (typeof m !== "object" || m === null) continue;
    const { role, content } = m as { role?: unknown; content?: unknown };
    const papel: Mensaje["role"] = role === "assistant" ? "assistant" : "user";
    const texto = String(content ?? "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, MAX_CARACTERES);
    if (!texto) continue;
    const ultimo = msgs[msgs.length - 1];
    if (ultimo && ultimo.role === papel) {
      ultimo.content += `\n\n${texto}`;
      continue;
    }
    msgs.push({ role: papel, content: texto });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  return msgs;
};

/** Las únicas claves del perfil que se le pasan al modelo (las del original). */
const CLAVES_PERFIL = ["sector", "sectorLabel", "team", "sedes", "pain", "name", "citas", "ticket", "rate"];

const perfilLimpio = (crudo: unknown): Record<string, unknown> => {
  if (typeof crudo !== "object" || crudo === null) return {};
  const entrada = crudo as Record<string, unknown>;
  const salida: Record<string, unknown> = {};
  for (const k of CLAVES_PERFIL) {
    const v = entrada[k];
    if (v === undefined || v === null) continue;
    salida[k] = typeof v === "string" ? v.replace(/<[^>]*>/g, "").slice(0, 120) : v;
  }
  return salida;
};

/* ------------------------------------------------------------
   Cabeceras
------------------------------------------------------------ */
const cabeceras = (origen: string): Record<string, string> => {
  const h: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (origen && origenesPermitidos().includes(origen)) {
    h["Access-Control-Allow-Origin"] = origen;
    h.Vary = "Origin";
  }
  return h;
};

/* ------------------------------------------------------------
   GET · ¿hay IA detrás?
   No dice nada de la clave: solo si existe o no.
------------------------------------------------------------ */
export function GET(req: Request) {
  const origen = req.headers.get("origin") ?? "";
  return NextResponse.json(
    { configurado: Boolean(process.env.ANTHROPIC_API_KEY) },
    { headers: cabeceras(origen) },
  );
}

export function OPTIONS(req: Request) {
  const origen = req.headers.get("origin") ?? "";
  return new Response(null, {
    status: 204,
    headers: {
      ...cabeceras(origen),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/* ------------------------------------------------------------
   POST · la conversación
------------------------------------------------------------ */
export async function POST(req: Request) {
  const origen = req.headers.get("origin") ?? "";
  const cab = cabeceras(origen);
  const mal = (estado: number, error: string) =>
    NextResponse.json({ error }, { status: estado, headers: cab });

  if (!origenValido(origen, req.headers.get("host"))) return mal(403, "origin_not_allowed");

  const clave = process.env.ANTHROPIC_API_KEY;
  /* Apagado: el widget lo entiende y se queda con el guion. */
  if (!clave) return mal(503, "not_configured");

  if (demasiado(huella(req))) return mal(429, "rate_limited");
  if (topeDelDiaGastado()) return mal(429, "daily_cap");

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return mal(400, "bad_request");
  }
  if (typeof cuerpo !== "object" || cuerpo === null) return mal(400, "bad_request");
  const { messages, page, profile } = cuerpo as {
    messages?: unknown; page?: unknown; profile?: unknown;
  };
  if (!Array.isArray(messages)) return mal(400, "bad_request");

  const msgs = limpiarConversacion(messages);
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return mal(400, "no_user_message");

  const system = construirPrompt({
    pagina: String(page ?? "").replace(/[^a-z-]/g, ""),
    perfil: perfilLimpio(profile),
  });

  /* La cuenta del día sube ANTES de llamar: si subiera después, una
     tanda de peticiones simultáneas se colaría entera por el hueco
     entre la comprobación y el apunte. */
  delDia.cuenta += 1;

  const corte = AbortSignal.timeout(TIEMPO_MAXIMO_MS);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: corte,
      headers: {
        "content-type": "application/json",
        "x-api-key": clave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.BOOKMY_AI_MODEL || MODELO_POR_DEFECTO,
        max_tokens: MAX_TOKENS,
        system,
        messages: msgs,
      }),
    });
    /* Hacia fuera, un solo error genérico: lo que conteste Anthropic
       no es asunto del navegador y puede llevar detalles de la cuenta. */
    if (!r.ok) return mal(502, "upstream_error");

    const datos: unknown = await r.json();
    const bloques = (datos as { content?: unknown }).content;
    const respuesta = (Array.isArray(bloques) ? bloques : [])
      .map((b) => (typeof b === "object" && b !== null && (b as { type?: string }).type === "text"
        ? String((b as { text?: unknown }).text ?? "")
        : ""))
      .join("")
      .trim();

    if (!respuesta) return mal(502, "empty_reply");
    return NextResponse.json({ reply: respuesta }, { headers: cab });
  } catch {
    return mal(502, "upstream_error");
  }
}
