# Subir el APK de Android

Sube el archivo de la app para Android a **`public/descargas/`** con este nombre
exacto:

```
bookmy.apk
```

Todos los botones «Descargar APK» de la web apuntan a `/descargas/bookmy.apk`.
La ruta vive en `FUERA.apk`, en [`src/lib/web/rutas.ts`](../src/lib/web/rutas.ts),
y la consumen:

| Dónde | Fichero |
|---|---|
| Menú de la cabecera (mundo app) | `src/components/web/SiteHeader.tsx` |
| Tarjeta de descarga y columna del pie | `src/components/web/SiteFooter.tsx` |
| Dos tarjetas y el FAQ de `/app` | `src/app/(web)/app/PantallaApp.tsx` |
| Tarjeta de descarga de `/crm` | `src/app/(web)/crm/PantallaCrm.tsx` |

Son **9 enlaces repartidos en 3 páginas** (`/app`, `/app/empresas`, `/crm`).

## Mientras el archivo no esté

Esos nueve botones dan **404**. Desde el 19/11/2026 ese 404 ya no es la pantalla
en inglés de Next: hay un `src/app/not-found.tsx` en español con salida al inicio
y a contacto. Pero sigue siendo un error donde el visitante esperaba una descarga,
y el FAQ de `/app` promete por escrito que se puede bajar el APK.

Si la app no se va a repartir así, lo correcto no es dejarlos roto: se quita
`FUERA.apk` de `rutas.ts` y las tarjetas de descarga se quedan con Google Play y
App Store, que es lo que de verdad hay.

## Por qué esta nota no está en `public/`

Estaba, como `public/descargas/LEEME.txt`, y **se servía abierta en Internet**:
cualquiera podía leer en `bookmy.es/descargas/LEEME.txt` que los botones estaban
roto y en qué fichero del código se arreglaban. Todo lo que vive en `public/` es
público; una nota para el equipo no va ahí.
