"use client";
/* ============================================================
   Política de movimiento de toda la app (MOTION_SPEC.md §10)
   ------------------------------------------------------------
   `reducedMotion="user"` respeta la preferencia del sistema:
   quien tenga activado "reducir movimiento" no recibe transforms
   ni animaciones de layout, solo fundidos cortos. El estado final
   siempre queda visible y legible.

   Va en un componente propio porque el layout raíz es de
   servidor y MotionConfig necesita cliente.
============================================================ */
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
