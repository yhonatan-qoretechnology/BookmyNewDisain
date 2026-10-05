/* ============================================================
   KycController — verificación de identidad del negocio
   ------------------------------------------------------------
   El negocio sube su documentación (POST /empresas/:id/kyc) y el
   superadmin la aprueba o la rechaza con un motivo. Por decisión de
   producto NO bloquea nada: mientras espera, el negocio trabaja igual
   y solo ve un aviso en su panel.
============================================================ */
import { KycApi } from "@/api/modules";
import type { ApiEmpresaKyc, ApiKycEstado, ApiKycPendiente } from "@/api/types";

/** Archivos y datos del formulario de verificación. */
export interface EnvioKyc {
  nifCif?: string;
  documentoTipo?: string;
  documentoFrente?: File | null;
  documentoDorso?: File | null;
  selfie?: File | null;
  justificante?: File | null;
}

/** Campos de archivo que acepta el backend, en el orden del formulario. */
export const ARCHIVOS_KYC = [
  "documentoFrente",
  "documentoDorso",
  "selfie",
  "justificante",
] as const;

export type ArchivoKyc = (typeof ARCHIVOS_KYC)[number];

export const KycController = {
  /** Estado de una empresa. PENDIENTE si nunca envió nada. */
  estado: (empresaId: number): Promise<ApiEmpresaKyc> => KycApi.estado(empresaId),

  /**
   * Envía o reenvía la documentación. Solo viaja lo que el usuario tocó:
   * los archivos que no se manden conservan los que ya había, para poder
   * corregir únicamente lo que pidió el superadmin.
   * @throws ApiError 400 si nunca se subió el documento del responsable.
   */
  async enviar(empresaId: number, envio: EnvioKyc): Promise<ApiEmpresaKyc> {
    const form = new FormData();
    if (envio.nifCif?.trim()) form.append("nifCif", envio.nifCif.trim());
    if (envio.documentoTipo?.trim()) form.append("documentoTipo", envio.documentoTipo.trim());
    for (const campo of ARCHIVOS_KYC) {
      const archivo = envio[campo];
      if (archivo) form.append(campo, archivo, archivo.name);
    }
    return KycApi.enviar(empresaId, form);
  },

  /** Cola de revisión del superadmin (las que están EN_REVISION). */
  pendientes: (): Promise<ApiKycPendiente[]> => KycApi.pendientes().catch(() => []),

  aprobar: (empresaId: number) => KycApi.aprobar(empresaId),
  rechazar: (empresaId: number, motivo: string) => KycApi.rechazar(empresaId, motivo),

  /** true cuando al negocio le toca hacer algo (enviar o corregir). */
  requiereAccion: (estado: ApiKycEstado | undefined) =>
    estado === "PENDIENTE" || estado === "RECHAZADA",
};
