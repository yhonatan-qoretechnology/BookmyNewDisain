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

   A 18/11/2026 el backend tiene PRO_SE_OFRECE = false y
   DIAS_DE_PRUEBA = 7. Es decir: la web puede prometer siete días
   y el backend NO los dará mientras ese interruptor siga apagado.
   Ese interruptor no se toca sin decidirlo: encenderlo significa
   volver a ofrecer Pro, y los cobros todavía no se efectúan.

   Mientras tanto, aquí está la palanca de la web: poner
   `SE_OFRECE_PRUEBA` en false cambia de golpe toda la promesa de
   las trece páginas, sin tocar ni un texto.
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

/** Días de prueba que anuncia la web. Igual que DIAS_DE_PRUEBA del backend. */
export const DIAS_DE_PRUEBA = 7;

/**
 * La clave de traducción del botón principal, que cambia con la
 * promesa: con prueba invita a probarla y sin ella, a empezar gratis.
 * Así ninguna página tiene que preguntarse qué poner.
 */
export const CLAVE_CTA = SE_OFRECE_PRUEBA ? "comun.nav.pruebaGratis" : "comun.nav.empiezaGratis";
