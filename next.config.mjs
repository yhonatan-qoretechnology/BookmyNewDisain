/* ============================================================
   Dominio propio · preparado, pero inerte hasta que existan
   las variables de entorno
   ------------------------------------------------------------
   Nada de aquí cambia el comportamiento de hoy: ningún host
   nuevo está escrito en el código. Mientras MEDIA_ORIGIN no
   esté definida, rewrites() devuelve lista vacía y el panel se
   sirve exactamente igual que antes.

   OJO, ESTO ES DE TIEMPO DE COMPILACIÓN (output: 'standalone'):
   `next build` serializa esta configuración dentro de
   .next/standalone/server.js y escribe los rewrites y los
   redirects en .next/routes-manifest.json. El servidor que
   arranca en producción ya no vuelve a leer este fichero. Si
   MEDIA_ORIGIN no está puesta CUANDO SE COMPILA, el rewrite no
   existirá por mucho que se defina después al arrancar: hay que
   volver a desplegar.
============================================================ */

/* Host que sirve los ficheros subidos. Las imágenes no están en
   Seenode: viven en el espacio web de IONOS y hoy se piden a
   https://bookmy.es/uploads/... Cuando bookmy.es pase a ser el
   panel, esa ruta la contestaría Next y las fotos darían 404; el
   rewrite de abajo la reenvía al host de los ficheros, así que
   incluso las URLs absolutas ya guardadas en la base de datos
   (chat_messages.file_url, gastos.ticketUrl) siguen resolviendo
   sin tocar ni una fila. */
const MEDIA_ORIGIN = (process.env.MEDIA_ORIGIN || '').trim().replace(/\/+$/, '');

/* Tiene que ser un origen absoluto: si no lleva protocolo, el
   destino del rewrite sería una ruta relativa al propio panel y
   nos quedaríamos dando vueltas sobre nosotros mismos. Ante la
   duda, no hay rewrite (= comportamiento de hoy). */
const MEDIA_ORIGIN_VALIDO = /^https?:\/\/[^/\s]+(\/[^\s]*)?$/.test(MEDIA_ORIGIN);

if (MEDIA_ORIGIN && !MEDIA_ORIGIN_VALIDO) {
  console.warn(
    `\n[bookmy] MEDIA_ORIGIN («${MEDIA_ORIGIN}») no es un origen absoluto; ` +
    'se esperaba algo como https://mi-host-de-ficheros. Se ignora: /uploads ' +
    'se seguirá sirviendo como hasta ahora.\n'
  );
}

/* El fallo más caro de diagnosticar: sin NEXT_PUBLIC_API_URL en el
   BUILD, API_URL queda en cadena vacía, el panel compila sin un
   solo error y cada petición sale contra el propio dominio (el
   login pide /auth/login al panel y recibe un 404 en HTML). El
   deploy sale verde, la web se ve perfecta y nadie puede entrar.
   Avisamos en el log del despliegue. A propósito NO se rompe el
   build: convertir un deploy que hoy funciona en uno que falla
   sería un cambio de comportamiento, y eso es justo lo que no
   queremos antes del cambio de dominio. */
if (!(process.env.NEXT_PUBLIC_API_URL || '').trim()) {
  console.warn(
    '\n[bookmy] NEXT_PUBLIC_API_URL está vacía al compilar. El panel se ' +
    'construirá igualmente, pero en el navegador las peticiones irán al ' +
    'propio dominio y NADIE PODRÁ ENTRAR (el login recibirá un 404 en ' +
    'HTML). Defínela en las variables de la aplicación y vuelve a ' +
    'desplegar.\n'
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bookmy.es',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.bookmy.es',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_BASE_URL_IMG: process.env.NEXT_PUBLIC_API_BASE_URL_IMG,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_QORE_URL: process.env.NEXT_PUBLIC_QORE_URL,
  },

  /**
   * /uploads/:path* → host de los ficheros (IONOS).
   *
   * Sin MEDIA_ORIGIN no hay ninguna regla, así que el panel se
   * comporta igual que hoy. Con ella, Next hace de proxy: no es
   * una redirección, el navegador sigue viendo la URL de siempre,
   * y por eso arregla también las URLs absolutas viejas que ya
   * están escritas en la base de datos.
   *
   * Funciona con output: 'standalone'. Comprobado en el propio
   * Next 14.2.35 instalado: el server.js del standalone arranca
   * `next/dist/server/lib/start-server`, que levanta
   * `router-server.js`, y ahí, cuando el destino de un rewrite
   * tiene protocolo, la petición se hace con `proxyRequest`
   * (router-server.js:278). El proxy es del propio servidor de
   * Next, no de la plataforma, así que no depende de Seenode.
   */
  async rewrites() {
    if (!MEDIA_ORIGIN_VALIDO) return [];
    return [
      {
        source: '/uploads/:path*',
        destination: `${MEDIA_ORIGIN}/uploads/:path*`,
      },
    ];
  },

  /**
   * www.bookmy.es → bookmy.es, conservando ruta y query.
   *
   * Hoy esta regla no se ejecuta nunca: www no apunta a Seenode,
   * así que ninguna petición llega con ese Host. Queda puesta para
   * que el día del cambio no haya dos sitios distintos (dos
   * almacenamientos de navegador, dos URLs indexables, dos
   * sesiones).
   *
   * Va con `statusCode: 301` y no con `permanent: true` a
   * propósito: `permanent: true` emite un 308, y aunque Google
   * trate 301 y 308 igual, el 301 es el que entienden todos los
   * crawlers, proxies y clientes HTTP viejos. El 308 solo aporta
   * conservar el método y el cuerpo de un POST, y aquí no hace
   * falta: el panel manda sus POST al API (api.bookmy.es), nunca a
   * www. Si algún día se quiere poder deshacerlo rápido, cámbialo
   * por `permanent: false` (307) y los navegadores dejarán de
   * cachearlo.
   *
   * El Host se lee de la cabecera `Host` tal cual
   * (prepare-destination.js, case 'host'); NO se mira
   * x-forwarded-host. El día del cambio hay que confirmar que el
   * proxy de Seenode pasa el Host original.
   */
  async redirects() {
    return [
      {
        source: '/:path*',
        /* Next compila este value como expresion regular
           (matchHas hace new RegExp('^' + value + '$')), asi que los
           puntos van escapados: sin escapar, 'www.bookmy.es' tambien
           casaria con hosts como 'wwwXbookmyYes'. */
        has: [{ type: 'host', value: 'www\\.bookmy\\.es' }],
        destination: 'https://bookmy.es/:path*',
        statusCode: 301,
      },
    ];
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Build optimizations
  swcMinify: true,
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Strict mode for better error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
