"use client";
/* ============================================================
   Administradores — alta, edición y baja de COMPANY_ADMIN /
   BRANCH_ADMIN (AdminManagementModule del backend)
   ------------------------------------------------------------
   · Superadmin: elige la empresa y, si el acceso es solo de una sede,
     también la sede (sin sede → dueño de toda la empresa).
   · Dueño de empresa: gestiona los admins de SUS sedes. La empresa es
     la suya y la sede es obligatoria; el backend acota el listado y
     rechaza lo que no sea de su empresa.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FOTO = 5 * 1024 * 1024;

export default function AdministradoresPage() {
  const router = useRouter();
  const { session } = useSession();
  const { toast, confirm } = useUi();
  const { t } = useI18n();

  const esSuper = session?.role === "superadmin";
  const esDueno = session?.role === "owner";
  const permitido = esSuper || esDueno;

  /* GUARD DE ROL: superadmin y dueño de empresa */
  useEffect(() => {
    if (session && !permitido) router.replace(ROUTES.dashboard);
  }, [session, permitido, router]);

  const [search, setSearch] = useState("");

  /* Empresas y sus sedes (se reutilizan para resolver nombres en la
     tabla Y para poblar los selects del alta). El dueño solo tiene la
     suya: no se pide el listado de todas las empresas. */
  const { data: negocios } = useData<Pick<Negocio, "id" | "nombre">[]>(
    async () => {
      if (!session || !permitido) return [];
      if (esDueno) return [{ id: session.negocioId, nombre: session.negocioName }];
      return NegociosController.getAll();
    },
    [session?.id, permitido],
    []
  );
  const { data: sedesPorEmpresa } = useData(async () => {
    const map = new Map<string, Sede[]>();
    await Promise.all(negocios.map(async (n) => { map.set(n.id, await NegociosController.getSedes(n.id)); }));
    return map;
  }, [negocios], new Map<string, Sede[]>());

  const { data: admins, reload } = useData(
    () => (permitido ? AdministradoresController.getAll(negocios, sedesPorEmpresa) : Promise.resolve([])),
    [negocios, sedesPorEmpresa, permitido],
    [] as Administrador[]
  );

  const lista = useMemo(() => {
    const q = search.toLowerCase();
    /* El dueño gestiona a los de sus sedes; a sí mismo y a otros dueños
       los gestiona Bookmy. */
    return admins
      .filter((a) => esSuper || a.rol === "admin")
      .filter((a) => (a.nombre + a.email + a.negocioName + a.sedeName).toLowerCase().includes(q));
  }, [admins, search, esSuper]);

  /* ── Alta de administrador ──────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [genero, setGenero] = useState("");
  const [nacimiento, setNacimiento] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null);

  /* ── Edición ────────────────────────────────────────────── */
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const sedesDisponibles = sedesPorEmpresa.get(empresaId) || [];

  if (session && !permitido) return null;

  const limpiarDatos = () => {
    setFirstName(""); setLastName(""); setTelefono(""); setEmail("");
    setGenero(""); setNacimiento(""); setFoto(null);
  };

  const abrirAlta = () => {
    setEmpresaId(esDueno && session ? session.negocioId : "");
    setSedeId("");
    limpiarDatos();
    setCredenciales(null);
    setModalOpen(true);
  };
  const cerrarAlta = () => { setModalOpen(false); setCredenciales(null); };

  const elegirFoto = (f: File | null) => {
    if (f && !f.type.startsWith("image/")) { toast(t("administradores.fotoTipo"), "error"); return; }
    if (f && f.size > MAX_FOTO) { toast(t("administradores.fotoGrande"), "error"); return; }
    setFoto(f);
  };

  const crear = async () => {
    if (!empresaId || (esDueno && !sedeId) || !firstName.trim() || !lastName.trim() || !telefono.trim() || !email.trim()) {
      toast(t(esDueno ? "administradores.fillRequiredSede" : "administradores.fillRequired"), "error");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast(t("administradores.emailInvalido"), "error");
      return;
    }
    setCreando(true);
    try {
      const cred = await AdministradoresController.crear({
        empresaId, sedeId: sedeId || undefined,
        firstName: firstName.trim(), lastName: lastName.trim(),
        telefono: telefono.trim(), email: email.trim(),
        genero, nacimiento, foto,
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

  const abrirEdicion = (a: Administrador) => {
    setEditando(a);
    setFirstName(a.firstName || a.nombre);
    setLastName(a.lastName);
    setTelefono(a.telefono === "—" ? "" : a.telefono);
    setActivo(a.activo);
    setGenero(""); setNacimiento(""); setFoto(null);
    /* Género y nacimiento no vienen en el listado */
    void AdministradoresController.detalle(a.id).then((d) => {
      setGenero(d.genero);
      setNacimiento(d.nacimiento);
    });
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    if (!firstName.trim() || !lastName.trim() || !telefono.trim()) {
      toast(t("administradores.fillRequiredEdit"), "error");
      return;
    }
    setGuardando(true);
    try {
      await AdministradoresController.actualizar(editando.id, {
        firstName, lastName, telefono, activo, genero, nacimiento, foto,
      });
      await reload();
      toast(t("administradores.updated"), "success");
      setEditando(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
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
      /* El aviso sale cuando el backend responde: antes salía «eliminado»
         al instante, aunque el borrado fallara. */
      onConfirm: async () => {
        try {
          await AdministradoresController.remove(a.id);
          await reload();
          toast(t("administradores.deleted"), "success");
        } catch (e) {
          toast(e instanceof Error ? e.message : t("administradores.deleteError"), "error");
        }
      },
    });
  };

  /* Campos personales comunes al alta y a la edición */
  const camposPersonales = (pref: string) => (
    <>
      <Field label={t("administradores.firstName")} htmlFor={`${pref}-firstname`}>
        <input id={`${pref}-firstname`} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </Field>
      <Field label={t("administradores.lastName")} htmlFor={`${pref}-lastname`}>
        <input id={`${pref}-lastname`} value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </Field>
      <Field label={t("common.phone")} htmlFor={`${pref}-tel`}>
        <input id={`${pref}-tel`} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder={t("common.phonePh")} />
      </Field>
      <div className={styles.fila}>
        <Field label={t("administradores.genero")} htmlFor={`${pref}-genero`}>
          <select id={`${pref}-genero`} value={genero} onChange={(e) => setGenero(e.target.value)}>
            <option value="">{t("administradores.generoNinguno")}</option>
            <option value="male">{t("administradores.generoM")}</option>
            <option value="female">{t("administradores.generoF")}</option>
            <option value="other">{t("administradores.generoO")}</option>
          </select>
        </Field>
        <Field label={t("administradores.nacimiento")} htmlFor={`${pref}-nac`}>
          <input id={`${pref}-nac`} type="date" value={nacimiento} max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setNacimiento(e.target.value)} />
        </Field>
      </div>
      <Field label={t("administradores.foto")} htmlFor={`${pref}-foto`}>
        <input id={`${pref}-foto`} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)} />
      </Field>
      {foto && <p className={styles.hint}>{foto.name}</p>}
    </>
  );

  return (
    <>
      <Panel>
        <PanelHead
          title={t("administradores.panelTitle")}
          sub={t(esDueno ? "administradores.panelSubDueno" : "administradores.panelSub", { n: lista.length })}
        />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("administradores.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={abrirAlta}>{t("administradores.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="shield" title={t("administradores.emptyTitle")}
            message={t(esDueno ? "administradores.emptyMsgDueno" : "administradores.emptyMsg")} />
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
                    <IconButton aria-label={t("administradores.editAria", { nombre: a.nombre })} onClick={() => abrirEdicion(a)}>
                      <Icon name="edit" />
                    </IconButton>
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
            <ModalText>{t(esDueno ? "administradores.modalHintDueno" : "administradores.modalHint")}</ModalText>
            {esSuper && (
              <Field label={t("administradores.company")} htmlFor="ad-empresa">
                <select id="ad-empresa" value={empresaId} onChange={(e) => { setEmpresaId(e.target.value); setSedeId(""); }}>
                  <option value="">{t("administradores.companyPlaceholder")}</option>
                  {negocios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
              </Field>
            )}
            <Field label={t(esDueno ? "administradores.branchObligatoria" : "administradores.branch")} htmlFor="ad-sede">
              <select id="ad-sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} disabled={!empresaId}>
                <option value="">{t(esDueno ? "administradores.branchElige" : "administradores.branchPlaceholder")}</option>
                {sedesDisponibles.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Field>
            {esSuper && <p className={styles.hint}>{t("administradores.branchHint")}</p>}
            <Field label={t("common.email")} htmlFor="ad-email">
              <input id="ad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.com" />
            </Field>
            {email.trim() && !EMAIL_RE.test(email.trim()) && (
              <p className={styles.error} role="alert">{t("administradores.emailInvalido")}</p>
            )}
            {camposPersonales("ad")}
            <ModalActions>
              <Button variant="ghost" onClick={cerrarAlta} disabled={creando}>{t("common.cancel")}</Button>
              <Button onClick={() => void crear()} disabled={creando}>
                {creando ? t("administradores.creating") : t("administradores.create")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>

      {/* Edición de administrador */}
      <Modal open={!!editando} onClose={() => setEditando(null)}>
        <ModalTitle>{t("administradores.editTitle")}</ModalTitle>
        {editando && (
          <>
            <ModalText>
              {editando.email} · {editando.sedeName || editando.negocioName}
            </ModalText>
            {camposPersonales("ed")}
            <label className={styles.check}>
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              {t("administradores.activoLabel")}
            </label>
            <ModalActions>
              <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
              <Button onClick={() => void guardarEdicion()} disabled={guardando}>
                {guardando ? t("administradores.saving") : t("administradores.save")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
