import type { ApiKycEstado } from "@/api/types";

/** Cómo se pinta cada estado con los colores que ya usa el panel. */
export const BADGE_KYC: Record<ApiKycEstado, "activo" | "pendiente" | "inactivo" | "cancelado"> = {
  APROBADA: "activo",
  EN_REVISION: "pendiente",
  PENDIENTE: "inactivo",
  RECHAZADA: "cancelado",
};

/** Formatos y tamaño que acepta cada documento (lo mismo que el resto del panel). */
export const TIPOS_ARCHIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_BYTES = 10 * 1024 * 1024;
