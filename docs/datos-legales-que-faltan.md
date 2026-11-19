# Datos que faltan en la política de privacidad y de cookies

*Documento para el área encargada · 18 de noviembre de 2026*

La web de Bookmy publica ahora mismo **once huecos sin rellenar**, resaltados en
ámbar, en <https://bookmy.es/privacidad> y <https://bookmy.es/cookies>.
No son once cosas distintas:

- **Cuatro son datos de la empresa** que necesitamos que nos pasen (uno de ellos,
  el del Delegado de Protección de Datos, puede ser que simplemente no exista:
  con decirlo, se quita la línea).
- **Uno es una decisión** sobre el papel de Qore Technology.
- **Los seis restantes son dos filas de la tabla de cookies** que, por lo que
  hemos comprobado, creemos que hay que quitar. Eso también se resuelve con un
  sí o un no.

---

## 1 · Los cuatro datos del responsable

Los cuatro salen seguidos en el apartado 1 de <https://bookmy.es/privacidad>, en
el recuadro que identifica a quien responde de los datos. Es lo primero que el
RGPD obliga a decir, y hoy sale en blanco.

| Qué hace falta | Cómo saldrá publicado | En qué formato lo necesitamos |
| --- | --- | --- |
| Razón social | «Titular: … , que opera con la marca Bookmy» | El nombre exacto que figura en el Registro Mercantil, con su forma jurídica (S.L., S.A.U., etc.) |
| NIF | «NIF: …» | Tal cual, con letra |
| Domicilio | «Domicilio: …» | Dirección postal completa del domicilio social: calle, número, piso, código postal, localidad, provincia y país |
| Correo del Delegado de Protección de Datos | «Delegado de Protección de Datos: …» | El buzón al que quieran que escriba quien ejerza sus derechos. **Si no se ha designado DPD, decídnoslo y quitamos la línea**: dejarla vacía es peor que no tenerla, y no es obligatorio tener DPD en todos los casos |

En ese mismo recuadro ya salen publicados el correo de contacto
(contacto@bookmy.es) y el teléfono (+34 651 026 700). Si alguno de los dos no es
el que debe figurar como vía oficial para ejercer derechos, decídnoslo y se
cambia a la vez que lo demás.

---

## 2 · Qué papel tiene Qore Technology

En el apartado de con quién se comparten los datos, la política dice que **Qore
Technology recibe copia de las solicitudes de alta** para ayudar a gestionarlas,
y a continuación sale el hueco. Hay que elegir una de dos, y no es una cuestión
de redacción: cambia quién responde ante la persona y qué contrato tiene que
existir.

| Opción | Qué significa | Qué contrato exige |
| --- | --- | --- |
| **Encargado del tratamiento** (art. 28 RGPD) | Qore trata esos datos únicamente siguiendo instrucciones de Bookmy y para los fines de Bookmy. No decide nada por su cuenta ni los usa para lo suyo. Bookmy sigue siendo el único responsable frente a la persona. | Un contrato de encargo del tratamiento firmado entre Bookmy y Qore |
| **Corresponsable** (art. 26 RGPD) | Qore decide **junto con** Bookmy para qué se usan esos datos. Las dos empresas responden ante la persona, y la persona puede dirigirse a cualquiera de las dos. | Un acuerdo de corresponsabilidad, y la política tiene que resumir lo esencial de ese acuerdo y decir a quién dirigirse |

Quién puede responderlo: quien tenga a la vista el contrato firmado entre Bookmy
y Qore Technology. Si existe un contrato de encargo, la respuesta es la primera
opción y basta con confirmarlo.

Un detalle que conviene mirar a la vez: la política que está publicada **ya
declara** que hay un contrato de encargo del artículo 28 firmado con cada negocio
que usa Bookmy. Si con Qore la figura fuera la de corresponsable, esa frase se
queda corta y hay que añadir el párrafo del artículo 26.

---

## 3 · Las dos filas de cookies: creemos que hay que quitarlas, no rellenarlas

Los seis huecos que quedan no son seis datos: son **dos filas de la tabla de
cookies**, con tres casillas vacías cada una (nombre, titular y duración). Una
fila dice «Cookies de analítica, si se activan» y la otra «Cookies de marketing,
si se activan».

Lo comprobamos en el código y en la web ya publicada: **Bookmy no usa hoy ninguna
cookie de analítica ni de marketing.** No hay Google Analytics, ni Tag Manager,
ni píxel de Meta, ni ninguna herramienta de medición instalada. La web no carga
un solo script de terceros.

Así que esas dos filas describen cookies que no existen, y piden un proveedor y
una duración que nadie puede dar sin inventárselos.

Lo que proponemos, y solo hace falta un sí:

1. Quitar las dos filas de la tabla.
2. Añadir en su lugar una frase que diga la verdad: que Bookmy no utiliza
   actualmente cookies de analítica ni de publicidad, y que si algún día las
   incorpora, se añadirán a esta tabla y se pedirá el consentimiento antes de
   activarlas.

Eso deja la tabla completa y exacta, que es lo que exige la guía de la AEPD, y de
paso elimina seis de los once huecos sin pedir nada a nadie.

La alternativa es dejarlas y rellenarlas, pero entonces hace falta decidir
primero **qué** herramienta se va a instalar, y hasta que exista no hay proveedor
ni duración que poner.

Una cosa más, por si ayuda a decidir: el aviso de cookies de la web **ya ofrece**
las categorías de analítica y de marketing para que el visitante las acepte o las
rechace. Eso está bien y se puede quedar como está: el día que se instale una
herramienta, el consentimiento ya está recogido y funcionando.

---

## Dónde se ve cada cosa

| Hueco | Página | Apartado |
| --- | --- | --- |
| Razón social, NIF, domicilio, DPD | `/privacidad` | 1 · Responsable |
| Papel de Qore Technology | `/privacidad` | Destinatarios |
| Las dos filas de cookies (6 casillas) | `/cookies` | 3 · Lista de cookies y almacenamiento |

El texto de esas páginas no está escrito en el código de las pantallas: vive en
`src/i18n/dictionaries/web/privacidad.{es,en}.ts` y
`src/i18n/dictionaries/web/cookies.{es,en}.ts`, una clave por frase, para poder
revisarlo de un vistazo. Cuando lleguen los datos, se cambian ahí y se despliega.
