/* ============================================================
   Lo que la web PROMETE, en un solo interruptor
   ------------------------------------------------------------
   La web nueva dice "Prueba 7 días gratis" en la cabecera, en el
   pie, en las dos páginas de plan y en el asistente. Si ese
   número o esa promesa viven escritos en cada sitio, el día que
   cambien hay que cazarlos por trece páginas y en dos idiomas, y
   siempre se queda uno suelto diciendo lo que no es.

   ⚠️ ESTO TIENE QUE CUADRAR CON EL BACKEND
   Quien concede la prueba de verdad es el backend, en
   src/data/empresa/plan.service.ts:

     PRO_SE_OFRECE   · si está en false NO SE CONCEDE NINGUNA
                       PRUEBA, por mucho que la web la prometa:
                       el alta crea el negocio en Free y sin
                       prueba (registro-negocio.service.ts).
     DIAS_DE_PRUEBA  · cuántos días dura cuando sí se concede.

   ⚠️ OJO CON LOS DÍAS: EL BACKEND DESPLEGADO DICE 30, NO 7
   A 19/11/2026, en la rama que se despliega
   (origin/feacture/developApi2026) el backend tiene
   PRO_SE_OFRECE = false y DIAS_DE_PRUEBA = **30**. El cambio a 7
   está hecho pero SIN DESPLEGAR, en la rama feat/prueba-7-dias
   (c63d097). Mientras siga sin subir, el único sitio donde la
   prueba dura siete días es este archivo.

   Hoy eso no se nota en ninguna pantalla porque PRO_SE_OFRECE = false
   hace que `puedeProbar` sea siempre false y las tres pantallas de
   venta del panel (PlanProLock, TrialBanner y /plan) no se pinten.
   Pero si alguien enciende PRO_SE_OFRECE sin desplegar los 7 días,
   el panel dirá siete y el backend regalará treinta.

   ESTE NÚMERO LO USA TAMBIÉN EL PANEL
   No es solo de la web pública: lo importan los textos de /plan,
   /ayuda y las pantallas de venta de Pro, para que el número no
   esté escrito a mano en ningún sitio. Hubo que hacerlo porque el
   panel y el alta anunciaban "30 días" clavado en el diccionario
   mientras la web decía siete.

   El estado del plan que manda la API trae `diasDePrueba`, pero NO
   sirve para esto: son los días que QUEDAN de una prueba en marcha
   (0 si no hay ninguna), y estos textos salen justo antes de
   empezarla. La duración solo vive aquí.

   Ese interruptor no se toca sin decidirlo: encenderlo significa
   volver a ofrecer Pro, y los cobros todavía no se efectúan.

   Mientras tanto, aquí está la palanca: poner `SE_OFRECE_PRUEBA`
   en false cambia de golpe toda la promesa, sin tocar ni un texto.
============================================================ */

/**
 * ¿La web ofrece la prueba gratuita de Pro?
 *
 * APAGADA a propósito (18/11/2026). No es un olvido ni algo "pendiente
 * de rellenar": la decisión es que la web no prometa una prueba
 * mientras los cobros no funcionen. Dos razones, y las dos mandan:
 *
 *   1. El backend tiene PRO_SE_OFRECE = false, así que hoy NO concede
 *      ninguna prueba. Prometerla sería mentir a cada visitante que se
 *      diera de alta.
 *   2. Aunque se encendiera, al séptimo día no hay forma de cobrar: el
 *      flujo de pago no está en marcha. Se regalaría Pro sin final.
 *
 * Tiene que valer lo mismo que PRO_SE_OFRECE en el backend. Ponerlo en
 * true sin encender también aquel deja la web prometiendo lo que el
 * alta no cumple.
 */
export const SE_OFRECE_PRUEBA = false;

/**
 * Días que dura la prueba. Tiene que valer lo mismo que DIAS_DE_PRUEBA en
 * el backend, y HOY NO LO VALE: el desplegado dice 30 (ver la cabecera).
 *
 * Lo usan la web pública Y el panel. Ningún texto debe llevar el número
 * escrito: se interpola con {dias}.
 */
export const DIAS_DE_PRUEBA = 7;

/**
 * La clave de traducción del botón principal, que cambia con la
 * promesa: con prueba invita a probarla y sin ella, a empezar gratis.
 * Así ninguna página tiene que preguntarse qué poner.
 */
export const CLAVE_CTA = SE_OFRECE_PRUEBA ? "comun.nav.pruebaGratis" : "comun.nav.empiezaGratis";
