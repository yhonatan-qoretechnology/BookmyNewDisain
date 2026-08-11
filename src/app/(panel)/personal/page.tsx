"use client";
/* ============================================================
   Personal — equipo con alta, edición, baja y acceso al panel
   ------------------------------------------------------------
   Cada profesional puede iniciar sesión en el panel (rol EMPLOYEE):
     · Alta:            POST /profesionales, con `password` obligatorio
                         — el backend genera el correo de acceso solo
                         (nombre@empresa.com) y lo devuelve en `acceso.email`.
     · Dar acceso:      PATCH /profesionales/:id/vincular-acceso
                         (profesionales viejos, `acceso.tieneAcceso === false`).
     · Cambiar acceso:  PATCH /profesionales/:id/acceso
                         (ya tiene login, `acceso.tieneAcceso === true`).
   GET /profesionales trae el bloque `acceso` con el estado y el
   correo real — no hace falta adivinarlo ni buscarlo aparte.
============================================================ */
import { useState } from "react";
import type { Empleado } from "@/models";
import { PersonalController } from "@/controllers/CrudControllers";
import { NegociosController } from "@/controllers/NegociosController";
import { ImagenesApi } from "@/api/modules";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import { PersonRow } from "@/components/ui/People";
import ImageUpload from "@/components/ui/ImageUpload";
import styles from "./personal.module.css";

/** Correo sugerido a partir del nombre: "Ana Ruiz" → "ana.ruiz" */
const sugerirEmail = (nombre: string, dominio: string) =>
  `${nombre.trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, ".")
    || "empleado"}@${dominio}`;

/** Credenciales para mostrar al admin tras dar/cambiar acceso o crear
    (la contraseña puede faltar si solo se cambió el correo). */
interface CredencialesVista {
  email: string;
  password: string | null;
}

export default function PersonalPage() {
  const { toast, confirm } = useUi();
  const { t } = useI18n();
  const { session } = useSession();
  const [search, setSearch] = useState("");

  /* Alta */
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [sede, setSede] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [guardandoAlta, setGuardandoAlta] = useState(false);

  const { data: sedesOpc } = useData(() => NegociosController.getSedesForSession(session), [session?.negocioId], []);
  /* MODO API: GET /profesionales (el nombre de sede se resuelve con sedesOpc) */
  const { data: lista, reload } = useData(
    () => PersonalController.search(search, sedesOpc),
    [search, sedesOpc], []
  );

  const abrirAlta = () => {
    setPassword(PersonalController.sugerirPassword());
    setModalOpen(true);
  };

  /* ── Acceso al panel (declarado antes de `agregar` para reusar su
     modal al mostrar el correo/contraseña recién creados) ────── */
  const [accesoDe, setAccesoDe] = useState<Empleado | null>(null);
  const [accesoEmail, setAccesoEmail] = useState("");
  const [accesoPassword, setAccesoPassword] = useState("");
  const [credenciales, setCredenciales] = useState<CredencialesVista | null>(null);
  const [generando, setGenerando] = useState(false);

  const cerrarAcceso = () => { setAccesoDe(null); setCredenciales(null); };

  const agregar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    /* POST /profesionales — el DTO exige phone único, sedeId y ahora password */
    if (!telefono.trim() || !sede) { toast(t("personal.fillApi"), "error"); return; }
    if (!password.trim()) { toast(t("personal.passwordRequired"), "error"); return; }
    setGuardandoAlta(true);
    try {
      const nombreCreado = nombre.trim();
      const { email } = await PersonalController.crear({ nombre, rol, telefono, sedeId: sede, password });
      setModalOpen(false); setNombre(""); setRol(""); setSede(""); setTelefono(""); setPassword("");
      await reload();
      toast(t("personal.added"), "success");
      /* Mostrar el correo que generó el backend + la contraseña que
         se envió, para que el admin se la entregue al profesional. */
      setAccesoDe({
        id: 0, nombre: nombreCreado, rol: "", foto: null, sede: "", sedeId: "",
        telefono: "", reservas: 0, activo: true, tieneAcceso: true, accesoEmail: email,
      });
      setCredenciales({ email, password });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardandoAlta(false);
    }
  };

  /* ── Edición ─────────────────────────────────────────────── */
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [eNombre, setENombre] = useState("");
  const [eRol, setERol] = useState("");
  const [eTelefono, setETelefono] = useState("");
  const [eSede, setESede] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrirEdicion = (p: Empleado) => {
    setEditando(p);
    setENombre(p.nombre);
    setERol(p.rol);
    setETelefono(p.telefono);
    setESede(p.sedeId);
  };

  /**
   * PATCH /profesionales/:id/imagen (multipart, campo "imagen").
   * Esta foto es la que se ve en el carrusel de profesionales al
   * agendar, así que se recarga la lista al terminar.
   */
  const subirFotoProfesional = async (empleado: Empleado, file: File) => {
    const actualizado = await ImagenesApi.profesional(Number(empleado.id), file);
    const ruta = actualizado?.imagen ?? null;
    setEditando((prev) => (prev ? { ...prev, foto: ruta } : prev));
    await reload();
    toast(t("imagen.actualizada"), "success");
    return ruta;
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    if (!eNombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    setGuardando(true);
    try {
      await PersonalController.update(editando.id, {
        nombre: eNombre, rol: eRol, telefono: eTelefono, sedeId: eSede,
      });
      setEditando(null);
      await reload();
      toast(t("personal.updated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
    }
  };

  const abrirAcceso = (p: Empleado) => {
    setAccesoDe(p);
    setCredenciales(null);
    if (p.tieneAcceso) {
      /* Ya tiene cuenta: el correo real ya viene en `acceso.email`,
         no hace falta adivinarlo ni buscarlo aparte. */
      setAccesoEmail(p.accesoEmail || "");
      setAccesoPassword("");
    } else {
      /* Profesional viejo sin login: sugerir correo y contraseña,
         ambos editables antes de vincular el acceso. */
      setAccesoEmail(sugerirEmail(p.nombre, session?.email.split("@")[1] || "bookmy.es"));
      setAccesoPassword(PersonalController.sugerirPassword());
    }
  };

  const generarAcceso = async () => {
    if (!accesoDe) return;
    setGenerando(true);
    try {
      if (!accesoDe.tieneAcceso) {
        if (!accesoEmail.trim() || !accesoPassword.trim()) {
          toast(t("personal.fillAccess"), "error");
          return;
        }
        const cred = await PersonalController.darAcceso(accesoDe.id, accesoEmail, accesoPassword);
        setCredenciales(cred);
      } else {
        const emailCambio = accesoEmail.trim().toLowerCase() !== (accesoDe.accesoEmail || "").toLowerCase()
          ? accesoEmail : undefined;
        const passwordCambio = accesoPassword.trim() || undefined;
        if (!emailCambio && !passwordCambio) {
          toast(t("personal.noChanges"), "error");
          return;
        }
        const res = await PersonalController.cambiarAcceso(accesoDe.id, { email: emailCambio, password: passwordCambio });
        setCredenciales({ email: res.email, password: res.password ?? null });
      }
      await reload();
      toast(t("personal.accessCreated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGenerando(false);
    }
  };

  const copiarCredenciales = async () => {
    if (!credenciales) return;
    try {
      const lineas = [`${t("common.email")}: ${credenciales.email}`];
      if (credenciales.password) lineas.push(`${t("personal.password")}: ${credenciales.password}`);
      await navigator.clipboard.writeText(lineas.join("\n"));
      toast(t("personal.copied"), "success");
    } catch {
      toast(t("personal.copyError"), "error");
    }
  };

  const eliminar = (id: number, nombreEmp: string) => {
    confirm({
      title: t("personal.deleteTitle"),
      message: t("personal.deleteMsg", { nombre: nombreEmp }),
      confirmLabel: t("common.delete"),
      onConfirm: () => {
        void PersonalController.remove(id).then(reload);
        toast(t("personal.deleted"), "success");
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("personal.panelTitle", { negocio: session?.negocioName || "—" })} sub={t("personal.countSub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("personal.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={abrirAlta}>{t("personal.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="team" title={t("personal.emptyTitle")} message={t("personal.emptyMsg")} />
        ) : (
          <DataTable headers={[t("common.name"), t("personal.role"), t("common.branch"), t("personal.monthBookings"), t("personal.access"), t("common.state"), t("common.actions")]}>
            {lista.map((p) => (
              <tr key={p.id}>
                <td><PersonRow name={p.nombre} photo={p.foto} bold /></td>
                <td>{p.rol}</td>
                <td>{p.sede}</td>
                <td><b>{p.reservas}</b></td>
                <td>
                  <Badge kind={p.tieneAcceso ? "activo" : "pendiente"}>
                    {p.tieneAcceso ? t("personal.hasAccess") : t("personal.noAccess")}
                  </Badge>
                </td>
                <td><Badge kind={p.activo ? "activo" : "inactivo"}>{p.activo ? t("personal.activeF") : t("personal.inactiveF")}</Badge></td>
                <td>
                  <div className={styles.rowActions}>
                    <IconButton aria-label={t("personal.editAria", { nombre: p.nombre })} onClick={() => abrirEdicion(p)}>
                      <Icon name="edit" />
                    </IconButton>
                    <Button size="sm" variant="ghost" onClick={() => abrirAcceso(p)}>
                      {p.tieneAcceso ? t("personal.changeAccess") : t("personal.createAccess")}
                    </Button>
                    <IconButton danger aria-label={t("personal.deleteAria", { nombre: p.nombre })} onClick={() => eliminar(p.id, p.nombre)}>
                      <Icon name="trash" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* Alta de integrante */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalTitle>{t("personal.modalTitle")}</ModalTitle>
        <Field label={t("common.fullName")} htmlFor="np-nombre">
          <input id="np-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("clientes.namePlaceholder")} />
        </Field>
        <Field label={t("personal.role")} htmlFor="np-rol">
          <input id="np-rol" value={rol} onChange={(e) => setRol(e.target.value)} placeholder={t("personal.rolePlaceholder")} />
        </Field>
        <Field label={t("common.phone")} htmlFor="np-tel">
          <input id="np-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <Field label={t("common.branch")} htmlFor="np-sede">
          <select id="np-sede" value={sede} onChange={(e) => setSede(e.target.value)}>
            <option value="">{t("reservas.selectPlaceholder")}</option>
            {sedesOpc.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label={t("personal.password")} htmlFor="np-pass">
          <div className={styles.passRow}>
            <input
              id="np-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("personal.passwordPlaceholder")}
            />
            <Button size="sm" variant="ghost" type="button" onClick={() => setPassword(PersonalController.sugerirPassword())}>
              {t("personal.generateShort")}
            </Button>
          </div>
        </Field>
        <p className={styles.credWarn}>{t("personal.createHint")}</p>
        <ModalActions>
          <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={guardandoAlta}>{t("common.cancel")}</Button>
          <Button onClick={() => void agregar()} disabled={guardandoAlta}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

      {/* Edición de integrante */}
      <Modal open={!!editando} onClose={() => setEditando(null)}>
        <ModalTitle>{t("personal.editTitle")}</ModalTitle>
        {editando && (
          <ImageUpload
            value={editando.foto}
            nombre={editando.nombre}
            variant="avatar"
            label={t("imagen.fotoProfesional")}
            hint={t("imagen.hint")}
            onUpload={(file) => subirFotoProfesional(editando, file)}
          />
        )}
        <Field label={t("common.fullName")} htmlFor="ep-nombre">
          <input id="ep-nombre" value={eNombre} onChange={(e) => setENombre(e.target.value)} />
        </Field>
        <Field label={t("personal.role")} htmlFor="ep-rol">
          <input id="ep-rol" value={eRol} onChange={(e) => setERol(e.target.value)} placeholder={t("personal.rolePlaceholder")} />
        </Field>
        <Field label={t("common.phone")} htmlFor="ep-tel">
          <input id="ep-tel" value={eTelefono} onChange={(e) => setETelefono(e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <Field label={t("common.branch")} htmlFor="ep-sede">
          <select id="ep-sede" value={eSede} onChange={(e) => setESede(e.target.value)}>
            <option value="">{t("reservas.selectPlaceholder")}</option>
            {sedesOpc.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardarEdicion()} disabled={guardando}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

      {/* Acceso al panel: dar acceso / cambiar correo o contraseña */}
      <Modal open={!!accesoDe} onClose={cerrarAcceso}>
        <ModalTitle>
          {accesoDe?.tieneAcceso ? t("personal.changeAccessTitle") : t("personal.createAccessTitle")}
        </ModalTitle>
        {!credenciales && (
          <ModalText>
            {accesoDe?.tieneAcceso
              ? t("personal.changeAccessSub", { nombre: accesoDe?.nombre || "" })
              : t("personal.createAccessSub", { nombre: accesoDe?.nombre || "" })}
          </ModalText>
        )}

        {credenciales ? (
          <>
            <div className={styles.credBox}>
              <div className={styles.credRow}>
                <label>{t("common.email")}</label>
                <span className={styles.credValue}>{credenciales.email}</span>
              </div>
              {credenciales.password && (
                <div className={styles.credRow}>
                  <label>{t("personal.password")}</label>
                  <span className={styles.credValue}>{credenciales.password}</span>
                </div>
              )}
            </div>
            <p className={styles.credWarn}>
              {credenciales.password ? t("personal.credWarning") : t("personal.emailUpdated")}
            </p>
            <ModalActions>
              <Button variant="ghost" block onClick={cerrarAcceso}>{t("common.close")}</Button>
              <Button block onClick={() => void copiarCredenciales()}>{t("personal.copyCred")}</Button>
            </ModalActions>
          </>
        ) : (
          <>
            <Field label={t("personal.loginEmail")} htmlFor="pa-email">
              <input
                id="pa-email"
                type="email"
                value={accesoEmail}
                onChange={(e) => setAccesoEmail(e.target.value)}
                placeholder="empleado@tunegocio.com"
              />
            </Field>
            <Field label={accesoDe?.tieneAcceso ? t("personal.newPassword") : t("personal.password")} htmlFor="pa-pass">
              <div className={styles.passRow}>
                <input
                  id="pa-pass"
                  value={accesoPassword}
                  onChange={(e) => setAccesoPassword(e.target.value)}
                  placeholder={accesoDe?.tieneAcceso ? t("personal.keepPasswordPlaceholder") : t("personal.passwordPlaceholder")}
                />
                <Button size="sm" variant="ghost" type="button" onClick={() => setAccesoPassword(PersonalController.sugerirPassword())}>
                  {t("personal.generateShort")}
                </Button>
              </div>
            </Field>
            <p className={styles.credWarn}>{t("personal.accessHint")}</p>
            <ModalActions>
              <Button variant="ghost" block onClick={cerrarAcceso} disabled={generando}>{t("common.cancel")}</Button>
              <Button block onClick={() => void generarAcceso()} disabled={generando || !accesoEmail.trim()}>
                {generando ? t("booking.loading") : t("personal.generate")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
