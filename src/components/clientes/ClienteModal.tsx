"use client";
/* ============================================================
   ClienteModal — ficha editable de un cliente final.

   Reúne las tres operaciones de /clients sobre un mismo cliente:
   editar sus datos (PATCH), fijarle una contraseña nueva
   (PATCH :id/password) y dar de baja la cuenta (DELETE).

   La baja se explica antes de ejecutarla: si el cliente tiene
   citas o pagos el backend no puede borrarlo sin descuadrar la
   facturación, así que lo anonimiza. El aviso lo dice con las
   cifras reales que devuelve GET /clients/:id.
============================================================ */
import { useEffect, useState } from "react";
import type { ApiClient, ApiClientState } from "@/api/types";
import { ClientesController } from "@/controllers/CrudControllers";
import { fotoUrl, initials } from "@/constants";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "./ClienteModal.module.css";

const ESTADOS: ApiClientState[] = ["enabled", "disabled", "blocked"];

/** Campos editables; se rellenan al abrir con lo que ya tiene. */
interface Formulario {
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthdate: string;
  idioma: string;
  direccion: string;
  state: ApiClientState;
}

const VACIO: Formulario = {
  name: "", email: "", phone: "", gender: "",
  birthdate: "", idioma: "", direccion: "", state: "enabled",
};

function aFormulario(c: ApiClient): Formulario {
  return {
    name: c.userData?.name ?? "",
    email: c.email ?? "",
    phone: c.userData?.phone ?? "",
    gender: c.userData?.gender?.trim() ?? "",
    /* El input date necesita YYYY-MM-DD y el backend manda ISO */
    birthdate: c.userData?.birthdate ? c.userData.birthdate.slice(0, 10) : "",
    idioma: c.userData?.idioma ?? "",
    direccion: c.userData?.direccion ?? "",
    state: c.state,
  };
}

export default function ClienteModal({
  clienteId,
  onClose,
  onGuardado,
}: {
  /** null cierra el modal; al abrirlo se recarga la ficha del backend */
  clienteId: number | null;
  onClose: () => void;
  /** Se llama tras guardar o dar de baja para refrescar el listado */
  onGuardado: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const { toast, confirm } = useUi();

  const [cliente, setCliente] = useState<ApiClient | null>(null);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);

  /* La ficha se pide siempre al abrir: el listado no trae ni el
     idioma ni el historial, y son justo lo que se edita aquí. */
  useEffect(() => {
    if (clienteId == null) return;
    let vigente = true;
    setCargando(true);
    setCliente(null);
    setPassword("");
    setPassword2("");

    ClientesController.getDetalle(clienteId)
      .then((c) => {
        if (!vigente) return;
        setCliente(c);
        setForm(aFormulario(c));
      })
      .catch((e) => {
        if (!vigente) return;
        toast(e instanceof Error ? e.message : t("clientes.loadError"), "error");
        onClose();
      })
      .finally(() => { if (vigente) setCargando(false); });

    return () => { vigente = false; };
  }, [clienteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const guardar = async () => {
    if (clienteId == null || !cliente) return;
    if (!form.name.trim()) { toast(t("common.requiredName"), "error"); return; }
    if (!form.email.trim()) { toast(t("clientes.emailRequired"), "error"); return; }

    setGuardando(true);
    try {
      /* Solo viaja lo que cambió: así una edición de teléfono no
         reenvía el correo y no puede chocar con su propio índice. */
      const original = aFormulario(cliente);
      const cambios: Record<string, unknown> = {};
      (Object.keys(form) as (keyof Formulario)[]).forEach((k) => {
        if (form[k] !== original[k]) cambios[k] = form[k];
      });

      if (Object.keys(cambios).length === 0) {
        toast(t("clientes.noChanges"), "default");
        setGuardando(false);
        return;
      }

      await ClientesController.update(clienteId, cambios);
      toast(t("clientes.updated"), "success");
      await onGuardado();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPassword = async () => {
    if (clienteId == null) return;
    if (password.length < 6) { toast(t("clientes.passwordShort"), "error"); return; }
    if (password !== password2) { toast(t("clientes.passwordMismatch"), "error"); return; }

    setCambiandoPass(true);
    try {
      await ClientesController.cambiarPassword(clienteId, password);
      setPassword("");
      setPassword2("");
      toast(t("clientes.passwordChanged"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setCambiandoPass(false);
    }
  };

  const historial = cliente?.historial;
  const conservaHistorial =
    !!historial && (historial.citas + historial.pagos + historial.resenas + historial.gastos) > 0;

  const darDeBaja = () => {
    if (clienteId == null || !cliente) return;
    const nombre = cliente.userData?.name || cliente.email;

    confirm({
      title: t("clientes.deleteTitle"),
      /* El mensaje cambia según lo que el backend vaya a hacer, que
         ya se sabe por el historial que vino con la ficha. */
      message: conservaHistorial
        ? t("clientes.deleteMsgHistorial", {
            nombre,
            citas: String(historial!.citas),
            pagos: String(historial!.pagos),
          })
        : t("clientes.deleteMsg", { nombre }),
      confirmLabel: t("clientes.deleteConfirm"),
      onConfirm: async () => {
        try {
          const r = await ClientesController.remove(clienteId);
          toast(
            r.mode === "anonymized" ? t("clientes.anonymized") : t("clientes.deleted"),
            "success",
          );
          await onGuardado();
          onClose();
        } catch (e) {
          toast(e instanceof Error ? e.message : t("common.error"), "error");
        }
      },
    });
  };

  const foto = fotoUrl(cliente?.fotoPerfil);

  return (
    <Modal open={clienteId != null} onClose={onClose} maxWidth={640} contentScroll>
      <div className={styles.head}>
        <div className={styles.headTop}>
          <div className={styles.identidad}>
            {foto
              ? <img className={styles.avatar} src={foto} alt="" />
              : <span className={styles.avatarFallback}>{initials(form.name || "?")}</span>}
            <div className={styles.headText}>
              <h3>{form.name || t("clientes.detailTitle")}</h3>
              <p>{cliente ? t("clientes.detailSub", { id: String(cliente.id) }) : " "}</p>
            </div>
          </div>
          <button className={styles.cerrar} onClick={onClose} aria-label={t("popup.close")}>×</button>
        </div>
      </div>

      <div className={styles.scrollArea}>
        {cargando && <p className={styles.cargando}>{t("common.loading")}</p>}

        {cliente && (
          <>
            <section className={styles.bloque}>
              <h4>{t("clientes.sectionData")}</h4>
              <div className={styles.rejilla}>
                <label className={styles.campo}>
                  <span>{t("common.client")}</span>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </label>
                <label className={styles.campo}>
                  <span>{t("common.phone")}</span>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </label>
                <label className={`${styles.campo} ${styles.ancho}`}>
                  <span>{t("common.email")}</span>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  <small>{t("clientes.emailHint")}</small>
                </label>
                <label className={styles.campo}>
                  <span>{t("clientes.gender")}</span>
                  <input value={form.gender} onChange={(e) => set("gender", e.target.value)} />
                </label>
                <label className={styles.campo}>
                  <span>{t("clientes.birthdate")}</span>
                  <input type="date" value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} />
                </label>
                <label className={styles.campo}>
                  <span>{t("clientes.language")}</span>
                  <select value={form.idioma} onChange={(e) => set("idioma", e.target.value)}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label className={`${styles.campo} ${styles.ancho}`}>
                  <span>{t("clientes.address")}</span>
                  <input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} />
                </label>
                <label className={styles.campo}>
                  <span>{t("clientes.state")}</span>
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value as ApiClientState)}
                  >
                    {ESTADOS.map((s) => (
                      <option key={s} value={s}>{t(`clientes.states.${s}`)}</option>
                    ))}
                  </select>
                  <small>{t("clientes.stateHint")}</small>
                </label>
              </div>
            </section>

            <section className={styles.bloque}>
              <h4>{t("clientes.sectionPassword")}</h4>
              <p className={styles.nota}>{t("clientes.passwordHint")}</p>
              <div className={styles.rejilla}>
                <label className={styles.campo}>
                  <span>{t("clientes.newPassword")}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className={styles.campo}>
                  <span>{t("clientes.repeatPassword")}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                  />
                </label>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={cambiarPassword}
                disabled={cambiandoPass || !password}
              >
                {cambiandoPass ? t("common.saving") : t("clientes.setPassword")}
              </Button>
            </section>

            <section className={`${styles.bloque} ${styles.peligro}`}>
              <h4>{t("clientes.sectionDanger")}</h4>
              {conservaHistorial ? (
                <p className={styles.nota}>
                  {t("clientes.dangerHistorial", {
                    citas: String(historial!.citas),
                    pagos: String(historial!.pagos),
                    resenas: String(historial!.resenas),
                  })}
                </p>
              ) : (
                <p className={styles.nota}>{t("clientes.dangerClean")}</p>
              )}
              <Button size="sm" variant="danger" onClick={darDeBaja}>
                <Icon name="trash" width={15} height={15} />
                {t("clientes.deleteAccount")}
              </Button>
            </section>
          </>
        )}
      </div>

      <div className={styles.foot}>
        <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
        <Button onClick={guardar} disabled={guardando || !cliente}>
          {guardando ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </Modal>
  );
}
