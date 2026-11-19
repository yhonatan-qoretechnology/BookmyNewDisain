"use client";
/* ============================================================
   El asistente, enganchado a la web
   ------------------------------------------------------------
   <Asistente> es la vista y el motor de la conversación, y no
   sabe nada de Next: ni de rutas, ni de cookies, ni de si hay IA
   detrás. Este archivo es el que se lo cuenta, y vive en el marco
   común de (web) para que la conversación SOBREVIVA AL NAVEGAR:
   montado dentro de cada página se desmontaría al cambiar de
   pantalla y el visitante perdería el hilo a mitad de frase.

   POR QUÉ SE LE PREGUNTA AL SERVIDOR SI HAY IA
   El widget cambia lo que DICE según si hay un modelo detrás: la
   sugerencia flotante, la etiqueta «IA», el aviso de que las
   respuestas pueden fallar y la línea del pie. Si le pasáramos el
   endpoint a ciegas, presumiría de inteligencia artificial
   mientras responde con el guion. Así que se le pregunta a
   /api/asistente (que contesta solo sí o no, nunca la clave) y
   hasta que conteste se asume que NO hay IA, que es la respuesta
   honesta por defecto.

   Se pregunta UNA vez por pestaña, no por página: la respuesta se
   guarda en un módulo, así que navegar no repite la petición.

   EL CONTACTO VA SIN ENDPOINT, Y ES DELIBERADO
   El api/lead.php del original mandaba un correo. Aquí el backend
   ya tiene POST /contacto para eso, pero está detrás de un guardia
   de reCAPTCHA (@Recaptcha en contacto.controller.ts) y su DTO
   solo admite origen 'contacto' | 'solicitud' con nombre y correo
   obligatorios, mientras el widget manda el cuerpo del lead.php
   (perfil, resumen, pagina…). Un reenvío de servidor a servidor no
   podría firmar el reCAPTCHA, y la petición se rechazaría con un
   400 sin que el visitante se enterase. Sin endpoint el asistente
   cierra por WhatsApp o por correo CON EL RECADO YA ESCRITO, que
   es como viene el paquete original y lo que de verdad llega.

   DÓNDE NO SALE
   En la portada, no. Es el portal de dos puertas (elegir entre la
   app y el CRM) y en el paquete original era la única página que
   no cargaba js/assistant.js: no hay nada que vender todavía.
============================================================ */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Asistente from "./Asistente";
import { useCookieBanner } from "./CookieBanner";
import { WEB } from "@/lib/web/rutas";

/** La ruta del cerebro. Contesta 503 si no está configurado. */
const API = "/api/asistente";

/* La respuesta vive en el módulo y no en el estado: así se pregunta
   una vez por pestaña y no una vez por página. `null` = todavía no
   se sabe. */
let iaConocida: boolean | null = null;

/* ------------------------------------------------------------
   De la ruta al nombre de página que entiende el guion
   ------------------------------------------------------------
   El guion usa las claves del original (`data-page`), que no son
   las rutas: «plan-basic», no «/planes/basic». Importa de verdad,
   porque de esa clave dependen la sugerencia flotante de cada
   pantalla y el modo «app para personas», donde quien escribe
   quiere reservar y no comprar un CRM.
------------------------------------------------------------ */
const POR_RUTA: Record<string, string> = {
  [WEB.app]: "app",
  [WEB.appEmpresas]: "app-empresas",
  [WEB.crm]: "crm",
  [WEB.comoFunciona]: "como-funciona",
  [WEB.planes]: "planes",
  [WEB.planBasic]: "plan-basic",
  [WEB.planPro]: "plan-pro",
  [WEB.asistenteIa]: "asistente-ia",
  [WEB.quienesSomos]: "quienes-somos",
  [WEB.crearCuenta]: "crear-cuenta",
  [WEB.contacto]: "contacto",
  [WEB.privacidad]: "privacidad",
  [WEB.cookies]: "cookies",
};

export default function AsistenteWeb() {
  const ruta = usePathname();
  const { permite } = useCookieBanner();
  const [ia, setIa] = useState<boolean | null>(iaConocida);

  /* En la portada no se monta, así que tampoco se pregunta nada. */
  const fuera = ruta === WEB.portada;

  useEffect(() => {
    if (fuera || iaConocida !== null) return;
    const ctl = new AbortController();
    fetch(API, { method: "GET", signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        const v = Boolean(
          typeof d === "object" && d !== null && (d as { configurado?: unknown }).configurado,
        );
        iaConocida = v;
        setIa(v);
      })
      .catch(() => {
        /* Sin respuesta se queda con el guion: es lo honesto, porque
           anunciar una IA que no contesta sería peor que no anunciarla. */
        iaConocida = false;
        setIa(false);
      });
    return () => ctl.abort();
  }, [fuera]);

  if (fuera) return null;

  return (
    <Asistente
      pagina={POR_RUTA[ruta] ?? ""}
      endpoint={ia ? API : ""}
      /* Ver la cabecera: a propósito vacío. */
      leadEndpoint=""
      /* La conversación solo se recuerda entre visitas si aceptó las
         funcionales; si no, vive y muere en la pestaña. */
      consentimientoFuncional={permite("functional")}
    />
  );
}
