"use client";
/* ============================================================
   InvitarAmigosModal — código de invitación de un cliente
   ------------------------------------------------------------
   Desde Clientes (icono de regalo): enseña el código personal del
   cliente en el negocio para que traiga amigos, con botón para
   mandárselo por WhatsApp o copiarlo, y lo que ya ha conseguido
   (invitados y cupones).
============================================================ */
import { useState } from "react";
import { ReferidosClientesApi } from "@/api/modules";
import type { ApiReferidoClienteFicha } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon, { WhatsAppIcon } from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions } from "@/components/ui/Modal";
import { useTextoPremio } from "./ProgramaClientes";
import styles from "@/app/(panel)/referidos/referidos.module.css";

export default function InvitarAmigosModal({
  cliente,
  onClose,
}: {
  cliente: { id: number; nombre: string; telefono?: string } | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const textoPremio = useTextoPremio();
  const [copiado, setCopiado] = useState(false);
  const { data, loading, error } = useData(
    () => (cliente ? ReferidosClientesApi.cliente(cliente.id) : Promise.resolve(null)),
    [cliente?.id],
    null as ApiReferidoClienteFicha | null
  );

  const nombre = cliente?.nombre.split(/\s+/)[0] || "";
  const regalo = data ? textoPremio(data.regaloInvitado.tipo, data.regaloInvitado.valor) : "";
  const premio = data ? textoPremio(data.premioReferidor.tipo, data.premioReferidor.valor) : "";
  const textoWa = data
    ? [data.mensaje, t("refClientes.textoWa", { empresa: data.empresa, codigo: data.codigo, regalo })].filter(Boolean).join("\n\n")
    : "";
  /* El mensaje se le manda al cliente para que lo reenvíe a sus amigos */
  const tel = (cliente?.telefono || "").replace(/\D/g, "");
  const waHref = `https://wa.me/${tel}?text=${encodeURIComponent(textoWa)}`;

  const copiar = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(textoWa);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      toast(t("referidos.copiarError"), "error");
    }
  };

  return (
    <Modal open={!!cliente} onClose={onClose} maxWidth={520}>
      <ModalTitle>{t("refClientes.fichaTitulo", { nombre: cliente?.nombre || "" })}</ModalTitle>
      {loading && !data ? (
        <ModalText>{t("booking.loading")}</ModalText>
      ) : !data ? (
        <ModalText>{error || t("common.error")}</ModalText>
      ) : !data.activo ? (
        <div className={styles.aviso}>{t("refClientes.fichaInactivo")}</div>
      ) : (
        <>
          <ModalText>{t("refClientes.fichaTexto", { regalo, nombre, premio })}</ModalText>
          <div className={styles.codigoGrande} style={{ margin: "6px 0 12px" }}>
            <b>{data.codigo}</b>
            <Button size="sm" variant="ghost" onClick={() => void copiar()}>
              <Icon name={copiado ? "check" : "paperclip"} /> {copiado ? t("referidos.copiado") : t("referidos.copiar")}
            </Button>
          </div>
          <a className={`${styles.btnRed} ${styles.btnWa}`} href={waHref} target="_blank" rel="noopener noreferrer" style={{ width: "100%" }}>
            <WhatsAppIcon /> {t("refClientes.enviarWa", { nombre })}
          </a>

          <h4 style={{ margin: "18px 0 8px", fontSize: 13 }}>{t("refClientes.susInvitados")}</h4>
          {data.invitados.length === 0 ? (
            <p className={styles.ayuda}>{t("refClientes.ninguno")}</p>
          ) : (
            <div className={styles.historial}>
              {data.invitados.map((i) => (
                <div key={i.id} className={styles.hItem}>
                  <span className={styles.hTexto}>{i.nombre}</span>
                  <Badge kind={i.estado === "COMPLETADO" ? "activo" : i.estado === "ANULADO" ? "cancelado" : "pendiente"}>
                    {t(`refClientes.estados.${i.estado}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <h4 style={{ margin: "18px 0 8px", fontSize: 13 }}>{t("refClientes.susCupones")}</h4>
          {data.cupones.length === 0 ? (
            <p className={styles.ayuda}>{t("refClientes.ninguno")}</p>
          ) : (
            <div className={styles.historial}>
              {data.cupones.map((c) => (
                <div key={c.id} className={styles.hItem}>
                  <span className={styles.hMeses}>{textoPremio(c.tipo, c.valor)}</span>
                  <span className={styles.hTexto}>
                    <span className={styles.cuponCodigo} style={{ color: "inherit", fontSize: 13 }}>{c.codigo}</span>
                    <span>{t(c.motivo === "PREMIO" ? "refClientes.motivoPremio" : "refClientes.motivoBienvenida")}</span>
                  </span>
                  <Badge kind={c.estado === "DISPONIBLE" ? "activo" : c.estado === "USADO" ? "atendida" : "inactivo"}>
                    {t(`refClientes.estadosCupon.${c.estado}`)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
