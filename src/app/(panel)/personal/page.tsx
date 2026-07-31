"use client";
/* ============================================================
   Personal — equipo con alta, edición, baja y acceso al panel
   ------------------------------------------------------------
   Cada integrante puede tener un usuario propio (role EMPLOYEE)
   para entrar al panel y ver su calendario: se crea desde aquí
   con "Generar acceso" (POST /auth/register + vínculo user_id).
============================================================ */
import { useState } from "react";
import type { CredencialesEmpleado, Empleado } from "@/models";
import { PersonalController } from "@/controllers/CrudControllers";
import { NegociosController } from "@/controllers/NegociosController";
import { ProfesionalesApi } from "@/api/modules";
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
import styles from "./personal.module.css";

/** Correo sugerido a partir del nombre: "Ana Ruiz" → "ana.ruiz" */
const sugerirEmail = (nombre: string, dominio: string) =>
  `${nombre.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, ".")
    || "empleado"}@${dominio}`;

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

  const { data: sedesOpc } = useData(() => NegociosController.getSedesForSession(session), [session?.negocioId], []);
  /* MODO API: GET /profesionales (el nombre de sede se resuelve con sedesOpc) */
  const { data: lista, reload } = useData(
    () => PersonalController.search(search, sedesOpc),
    [search, sedesOpc], []
  );

  const agregar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    try {
      /* POST /profesionales — el DTO exige phone único y sedeId */
      if (!telefono.trim() || !sede) { toast(t("personal.fillApi"), "error"); return; }
      await ProfesionalesApi.create({
        nombre: nombre.trim(),
        phone: telefono.trim(),
        sedeId: Number(sede),
        biografia: rol.trim() || undefined,
      });
      setModalOpen(false); setNombre(""); setRol(""); setSede(""); setTelefono("");
      await reload();
      toast(t("personal.added"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
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

  /* ── Acceso al panel (usuario + contraseña) ──────────────── */
  const [accesoDe, setAccesoDe] = useState<Empleado | null>(null);
  const [email, setEmail] = useState("");
  const [credenciales, setCredenciales] = useState<CredencialesEmpleado | null>(null);
  const [generando, setGenerando] = useState(false);

  const abrirAcceso = (p: Empleado) => {
    setAccesoDe(p);
    setCredenciales(null);
    /* Dominio del correo de quien administra, como sugerencia */
    setEmail(sugerirEmail(p.nombre, session?.email.split("@")[1] || "bookmy.es"));
  };

  const cerrarAcceso = () => { setAccesoDe(null); setCredenciales(null); };

  const generarAcceso = async () => {
    if (!accesoDe) return;
    setGenerando(true);
    try {
      const cred = accesoDe.userId
        ? await PersonalController.regenerarPassword(accesoDe.userId, email)
        : await PersonalController.crearAcceso(accesoDe, email);
      setCredenciales(cred);
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
      await navigator.clipboard.writeText(
        `${t("common.email")}: ${credenciales.email}\n${t("personal.password")}: ${credenciales.password}`
      );
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
            <Button onClick={() => setModalOpen(true)}>{t("personal.new")}</Button>
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
                  <Badge kind={p.userId ? "activo" : "pendiente"}>
                    {p.userId ? t("personal.hasAccess") : t("personal.noAccess")}
                  </Badge>
                </td>
                <td><Badge kind={p.activo ? "activo" : "inactivo"}>{p.activo ? t("personal.activeF") : t("personal.inactiveF")}</Badge></td>
                <td>
                  <div className={styles.rowActions}>
                    <IconButton aria-label={t("personal.editAria", { nombre: p.nombre })} onClick={() => abrirEdicion(p)}>
                      <Icon name="edit" />
                    </IconButton>
                    <Button size="sm" variant="ghost" onClick={() => abrirAcceso(p)}>
                      {p.userId ? t("personal.resetAccess") : t("personal.createAccess")}
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
        <ModalActions>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => void agregar()}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

      {/* Edición de integrante */}
      <Modal open={!!editando} onClose={() => setEditando(null)}>
        <ModalTitle>{t("personal.editTitle")}</ModalTitle>
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

      {/* Acceso al panel: usuario + contraseña generada */}
      <Modal open={!!accesoDe} onClose={cerrarAcceso}>
        <ModalTitle>
          {accesoDe?.userId ? t("personal.resetAccessTitle") : t("personal.createAccessTitle")}
        </ModalTitle>
        <ModalText>
          {accesoDe?.userId
            ? t("personal.resetAccessSub", { nombre: accesoDe?.nombre || "" })
            : t("personal.createAccessSub", { nombre: accesoDe?.nombre || "" })}
        </ModalText>

        {credenciales ? (
          <>
            <div className={styles.credBox}>
              <div className={styles.credRow}>
                <label>{t("common.email")}</label>
                <span className={styles.credValue}>{credenciales.email}</span>
              </div>
              <div className={styles.credRow}>
                <label>{t("personal.password")}</label>
                <span className={styles.credValue}>{credenciales.password}</span>
              </div>
            </div>
            <p className={styles.credWarn}>{t("personal.credWarning")}</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!accesoDe?.userId}
                placeholder="empleado@tunegocio.com"
              />
            </Field>
            <p className={styles.credWarn}>{t("personal.accessHint")}</p>
            <ModalActions>
              <Button variant="ghost" block onClick={cerrarAcceso} disabled={generando}>{t("common.cancel")}</Button>
              <Button block onClick={() => void generarAcceso()} disabled={generando || !email.trim()}>
                {generando ? t("booking.loading") : t("personal.generate")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
