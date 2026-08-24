/** Etiquetas que los envoltorios de animación pueden renderizar.
    Se limita a las necesarias para no cargar tipos de todo el DOM. */
export type MotionTag =
  | "div" | "section" | "article" | "span" | "header" | "footer"
  | "ul" | "ol" | "li" | "tbody" | "tr" | "nav" | "aside" | "p";
