"use client";
/* ============================================================
   Administradores — alta de COMPANY_ADMIN / BRANCH_ADMIN
   (AdminManagementModule del backend)
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN: crea el usuario con el que un dueño de
   negocio (o un admin de sede) entra al panel. Se elige la empresa
   y, si el acceso es solo de una sede, se elige también la sede:
   sin sede → dueño de toda la empresa · con sede → admin de esa sede.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import type { Administrador, Negocio, Sede } from "@/models";
import { AdministradoresController } from "@/controllers/AdministradoresController";
import { NegociosController } from "@/controllers/NegociosController";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Badge, { RoleBadge } from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import { PersonRow } from "@/components/ui/People";
import styles from "./administradores.module.css";

export default function AdministradoresPage() {
  const router = useRouter();
  const { session } = useSession();
  const { toast, confirm } = useUi();
  const { t } = useI18n();

  /* GUARD DE ROL: esta vista solo existe para superadmin */
  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const [search, setSearch] = useState("");

  /* Empresas y sus sedes (se reutilizan para resolver nombres en la
     tabla Y para poblar los selects del alta) */
  const { data: negocios } = useData(() => NegociosController.getAll(), [], [] as Negocio[]);
  const { data: sedesPorEmpresa } = useData(async () => {
    const map = new Map<string, Sede[]>();
    await Promise.all(negocios.map(async (n) => { map.set(n.id, await NegociosController.getSedes(n.id)); }));
    return map;
  }, [negocios], new Map<string, Sede[]>());

  const { data: admins, reload } = useData(
    () => AdministradoresController.getAll(negocios, sedesPorEmpresa),
    [negocios, sedesPorEmpresa],
    [] as Administrador[]
  );

  const lista = useMemo(() => {
    const q = search.toLowerCase();
    return admins.filter((a) => (a.nombre + a.email + a.negocioName).toLowerCase().includes(q));
  }, [admins, search]);

  if (session && session.role !== "superadmin") return null;

  /* ── Alta de administrador ──────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [creando, setCreando] = useState(false);
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null);

  const sedesDisponibles = sedesPorEmpresa.get(empresaId) || [];

  const abrirAlta = () => {
    setEmpresaId(""); setSedeId(""); setFirstName(""); setLastName("");
    setTelefono(""); setEmail(""); setCredenciales(null);
    setModalOpen(true);
  };
  const cerrarAlta = () => { setModalOpen(false); setCredenciales(null); };

  const crear = async () => {
    if (!empresaId || !firstName.trim() || !lastName.trim() || !telefono.trim() || !email.trim()) {
      toast(t("administradores.fillRequired"), "error");
      return;
    }
    setCreando(true);
    try {
      const cred = await AdministradoresController.crear({
        empresaId, sedeId: sedeId || undefined,
        firstName: firstName.trim(), lastName: lastName.trim(),
        telefono: telefono.trim(), email: email.trim(),
      });
      setCredenciales(cred);
      await reload();
      toast(t("administradores.created"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setCreando(false);
    }
  };

  const copiarCredenciales = async () => {
    if (!credenciales) return;
    try {
      await navigator.clipboard.writeText(
        `${t("common.email")}: ${credenciales.email}\n${t("administradores.password")}: ${credenciales.password}`
      );
      toast(t("administradores.copied"), "success");
    } catch {
      toast(t("administradores.copyError"), "error");
    }
  };

  const eliminar = (a: Administrador) => {
    confirm({
      title: t("administradores.deleteTitle"),
      message: t("administradores.deleteMsg", { nombre: a.nombre }),
      confirmLabel: t("common.delete"),
      onConfirm: () => {
        void AdministradoresController.remove(a.id).then(reload);
        toast(t("administradores.deleted"), "success");
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("administradores.panelTitle")} sub={t("administradores.panelSub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("administradores.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={abrirAlta}>{t("administradores.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="shield" title={t("administradores.emptyTitle")} message={t("administradores.emptyMsg")} />
        ) : (
          <DataTable headers={[
            t("administradores.colName"), t("administradores.colEmail"), t("administradores.colRole"),
            t("administradores.colCompany"), t("administradores.colBranch"), t("common.state"), t("common.actions"),
          ]}>
            {lista.map((a) => (
              <tr key={a.id}>
                <td><PersonRow name={a.nombre} photo={a.foto} bold /></td>
                <td>{a.email}</td>
                <td>
                  <RoleBadge role={a.rol} label={t(a.rol === "owner" ? "administradores.roleCompany" : "administradores.roleBranch")} />
                </td>
                <td>{a.negocioName}</td>
                <td>{a.sedeName || "—"}</td>
                <td><Badge kind={a.activo ? "activo" : "inactivo"}>{a.activo ? t("servicios.active") : t("servicios.inactive")}</Badge></td>
                <td>
                  <div className={styles.rowActions}>
                    <IconButton danger aria-label={t("administradores.deleteAria", { nombre: a.nombre })} onClick={() => eliminar(a)}>
                      <Icon name="trash" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* Alta de administrador */}
      <Modal open={modalOpen} onClose={cerrarAlta}>
        <ModalTitle>{credenciales ? t("administradores.createdTitle") : t("administradores.modalTitle")}</ModalTitle>

        {credenciales ? (
          <>
            <ModalText>{t("administradores.createdSub", { nombre: `${firstName} ${lastName}`.trim() })}</ModalText>
            <div className={styles.credBox}>
              <div className={styles.credRow}>
                <label>{t("common.email")}</label>
                <span className={styles.credValue}>{credenciales.email}</span>
              </div>
              <div className={styles.credRow}>
                <label>{t("administradores.password")}</label>
                <span className={styles.credValue}>{credenciales.password}</span>
              </div>
            </div>
            <p className={styles.credWarn}>{t("administradores.credWarning")}</p>
            <ModalActions>
              <Button variant="ghost" block onClick={cerrarAlta}>{t("common.close")}</Button>
              <Button block onClick={() => void copiarCredenciales()}>{t("administradores.copyCred")}</Button>
            </ModalActions>
          </>
        ) : (
          <>
            <ModalText>{t("administradores.modalHint")}</ModalText>
            <Field label={t("administradores.company")} htmlFor="ad-empresa">
              <select id="ad-empresa" value={empresaId} onChange={(e) => { setEmpresaId(e.target.value); setSedeId(""); }}>
                <option value="">{t("administradores.companyPlaceholder")}</option>
                {negocios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </Field>
            <Field label={t("administradores.branch")} htmlFor="ad-sede">
              <select id="ad-sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} disabled={!empresaId}>
                <option value="">{t("administradores.branchPlaceholder")}</option>
                {sedesDisponibles.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Field>
            <p className={styles.hint}>{t("administradores.branchHint")}</p>
            <Field label={t("administradores.firstName")} htmlFor="ad-firstname">
              <input id="ad-firstname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label={t("administradores.lastName")} htmlFor="ad-lastname">
              <input id="ad-lastname" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
            <Field label={t("common.phone")} htmlFor="ad-tel">
              <input id="ad-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
            </Field>
            <Field label={t("common.email")} htmlFor="ad-email">
              <input id="ad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.com" />
            </Field>
            <ModalActions>
              <Button variant="ghost" onClick={cerrarAlta} disabled={creando}>{t("common.cancel")}</Button>
              <Button onClick={() => void crear()} disabled={creando}>
                {creando ? t("administradores.creating") : t("administradores.create")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
