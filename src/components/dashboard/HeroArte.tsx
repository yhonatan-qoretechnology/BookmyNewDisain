"use client";
/* ============================================================
   Ilustraciones 3D del banner (MOTION_SPEC.md §6.9, ref. 01, 11, 12)
   ------------------------------------------------------------
   Están dibujadas aquí, en SVG, y no son imágenes: así heredan el
   color del panel. Todo el volumen sale de `currentColor` -que el
   CSS ata a --accent- y de --surface-elevated, de modo que la misma
   ilustración vale en claro, en oscuro, con la marca QoreTech y con
   el color que elija cada negocio. Una imagen de archivo con el
   verde quemado dentro se quedaría fuera de sitio en los tres casos.

   Son decorativas: aria-hidden y sin texto. Lo que cuentan ya está
   escrito al lado en el banner.
============================================================ */

/** Ventana flotante con el gráfico, la esfera y las monedas (ref. 12). */
export function ArteVentana({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 180" fill="none" aria-hidden focusable="false">
      <defs>
        <linearGradient id="bmHeroVentana" x1="0" y1="0" x2=".5" y2="1">
          <stop offset="0%" stopColor="var(--surface-elevated)" />
          <stop offset="100%" stopColor="var(--surface-2)" />
        </linearGradient>
        <linearGradient id="bmHeroBarra" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity=".92" />
        </linearGradient>
        <radialGradient id="bmHeroEsfera" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".8" />
          <stop offset="48%" stopColor="currentColor" stopOpacity=".95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity=".55" />
        </radialGradient>
        <linearGradient id="bmHeroMoneda" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity=".55" />
        </linearGradient>
        {/* Sombra de contacto: negra y muy abierta, como las del panel */}
        <filter id="bmHeroSombra" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="rgb(0,0,0)" floodOpacity=".16" />
        </filter>
      </defs>

      {/* Esfera de plastilina, asomando por detrás */}
      <g filter="url(#bmHeroSombra)">
        <circle cx="188" cy="58" r="25" fill="url(#bmHeroEsfera)" />
        <ellipse cx="179" cy="48" rx="8" ry="5" fill="#fff" opacity=".35" transform="rotate(-28 179 48)" />
      </g>

      {/* Ventana con el gráfico, ligeramente girada para que no sea un rectángulo plano */}
      <g transform="rotate(-3 92 94)" filter="url(#bmHeroSombra)">
        <rect x="16" y="40" width="152" height="108" rx="18" fill="url(#bmHeroVentana)" />
        <rect x="16" y="40" width="152" height="108" rx="18" fill="none" stroke="#fff" strokeOpacity=".5" />
        {/* Franja de luz de arriba: el mismo filo que --highlight */}
        <path d="M34 41h116" stroke="#fff" strokeOpacity=".65" strokeWidth="1.5" strokeLinecap="round" />

        <g fill="currentColor" opacity=".35">
          <circle cx="32" cy="56" r="3" />
          <circle cx="42" cy="56" r="3" />
          <circle cx="52" cy="56" r="3" />
        </g>

        {/* Barras: crecen hacia la derecha, como el gráfico del video */}
        <g fill="url(#bmHeroBarra)">
          <rect x="38" y="100" width="16" height="30" rx="8" />
          <rect x="64" y="80" width="16" height="50" rx="8" />
          <rect x="90" y="92" width="16" height="38" rx="8" />
          <rect x="116" y="66" width="16" height="64" rx="8" />
        </g>

        {/* Flecha de tendencia por encima */}
        <path
          d="M44 118 72 98 98 106 126 76"
          stroke="var(--navy-900)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M114 74h14v14"
          stroke="var(--navy-900)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Monedas apiladas */}
      <g filter="url(#bmHeroSombra)">
        <ellipse cx="184" cy="142" rx="21" ry="7.5" fill="url(#bmHeroMoneda)" />
        <ellipse cx="184" cy="134" rx="21" ry="7.5" fill="url(#bmHeroMoneda)" />
        <ellipse cx="184" cy="126" rx="21" ry="7.5" fill="url(#bmHeroMoneda)" />
        <ellipse cx="184" cy="126" rx="13" ry="4.5" fill="#fff" opacity=".28" />
      </g>

      {/* Destellos */}
      <g fill="currentColor" opacity=".45">
        <path d="M214 104c.7 3.3 1.6 4.2 4.9 4.9-3.3.7-4.2 1.6-4.9 4.9-.7-3.3-1.6-4.2-4.9-4.9 3.3-.7 4.2-1.6 4.9-4.9Z" />
        <path d="M26 22c.5 2.4 1.2 3.1 3.6 3.6-2.4.5-3.1 1.2-3.6 3.6-.5-2.4-1.2-3.1-3.6-3.6 2.4-.5 3.1-1.2 3.6-3.6Z" />
        <circle cx="206" cy="24" r="2.6" opacity=".7" />
      </g>
    </svg>
  );
}

/** Planta del borde derecho (ref. 11): entra tarde y crece desde abajo. */
export function ArtePlanta({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 110 150" fill="none" aria-hidden focusable="false">
      <defs>
        <linearGradient id="bmHeroHoja" x1="0" y1="1" x2=".4" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="bmHeroMaceta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--surface-elevated)" />
          <stop offset="100%" stopColor="var(--surface-2)" />
        </linearGradient>
        <filter id="bmHeroSombraPlanta" x="-40%" y="-30%" width="180%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="rgb(0,0,0)" floodOpacity=".16" />
        </filter>
      </defs>

      {/* Hojas en abanico: la de atrás más apagada, la del centro entera */}
      <g fill="url(#bmHeroHoja)">
        <ellipse cx="55" cy="67" rx="10" ry="30" opacity=".55" transform="rotate(-46 55 96)" />
        <ellipse cx="55" cy="63" rx="11" ry="34" opacity=".75" transform="rotate(-23 55 96)" />
        <ellipse cx="55" cy="60" rx="12" ry="37" />
        <ellipse cx="55" cy="63" rx="11" ry="34" opacity=".8" transform="rotate(23 55 96)" />
        <ellipse cx="55" cy="67" rx="10" ry="30" opacity=".6" transform="rotate(46 55 96)" />
      </g>
      {/* Nervio central: un filo de luz por hoja, para que tengan volumen */}
      <g stroke="#fff" strokeOpacity=".3" strokeWidth="1.6" strokeLinecap="round">
        <path d="M55 92V36" transform="rotate(-23 55 96)" />
        <path d="M55 92V30" />
        <path d="M55 92V36" transform="rotate(23 55 96)" />
      </g>

      {/* Tierra y maceta */}
      <g filter="url(#bmHeroSombraPlanta)">
        <ellipse cx="55" cy="97" rx="26" ry="7" fill="currentColor" opacity=".35" />
        <path
          d="M29 96h52l-6 40c-.6 4-4 7-8 7H43c-4 0-7.4-3-8-7l-6-40Z"
          fill="url(#bmHeroMaceta)"
        />
        <path d="M29 96h52l-1.4 9H30.4L29 96Z" fill="currentColor" opacity=".16" />
        <path
          d="M36 104c1.5 14 3 24 5 34"
          stroke="#fff"
          strokeOpacity=".45"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
