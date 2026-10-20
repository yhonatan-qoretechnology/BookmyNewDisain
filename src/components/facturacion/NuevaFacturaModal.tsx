"use client";
/* ============================================================
   NuevaFacturaModal — alta manual de una factura
   ------------------------------------------------------------
   No existe un "crear factura suelta": toda factura es un Payment
   que nace de un Appointment (ver FacturasController.crear). Este
   formulario arma esa cita — ya COMPLETED, porque lo que se está
   registrando ya ocurrió — y el backend genera el pago solo.

   Sede → cliente → servicio → profesional → fecha/hora → precio →
   método de pago, en un único formulario (no un asistente de varios
   pasos): esto es carga administrativa retroactiva, no el flujo de
   reserva del cliente final.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@/models";
import type { ClienteOpcion } from "@/models";
import type { ApiPrice, ApiProfesional, ApiService } from "@/api/types";
import { ApiError } from "@/api/http";
import {
  FacturasController,
  FiltroFacturasController,
  NuevaFacturaController,
  type OpcionFiltro,
} from "@/controllers/FacturacionControllers";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./facturacion.module.css";

function hoyYmd() {
  return new Date().toISOString().slice(0, 10);
}
function ahoraHm() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function NuevaFacturaModal({
  open,
  onClose,
  session,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  onCreated: () => void;
}) {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const esSuperadmin = session?.role === "superadmin";

  const [empresaId, setEmpresaId] = useState("");
  const [empresasOpt, setEmpresasOpt] = useState<OpcionFiltro[]>([]);
  const [sedeId, setSedeId] = useState("");
  const [sedesOpt, setSedesOpt] = useState<OpcionFiltro[]>([]);

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesOpt, setClientesOpt] = useState<ClienteOpcion[]>([]);
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);

  const [servicios, setServicios] = useState<ApiService[]>([]);
  const [servicioId, setServicioId] = useState("");
  const [precioIdx, setPrecioIdx] = useState(0);
  const [precio, setPrecio] = useState("");

  const [profesionales, setProfesionales] = useState<ApiProfesional[]>([]);
  const [profesionalId, setProfesionalId] = useState("");

  const [fecha, setFecha] = useState(hoyYmd());
  const [hora, setHora] = useState(ahoraHm());
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta">("efectivo");
  const [tarjeta, setTarjeta] = useState({ numero: "", vencimiento: "", cvv: "" });

  const [creando, setCreando] = useState(false);

  /* Reinicia todo el formulario cada vez que se abre */
  useEffect(() => {
    if (!open) return;
    setEmpresaId(""); setSedeId(""); setBusquedaCliente(""); setClientesOpt([]); setCliente(null);
    setServicios([]); setServicioId(""); setPrecioIdx(0); setPrecio("");
    setProfesionales([]); setProfesionalId("");
    setFecha(hoyYmd()); setHora(ahoraHm());
    setMetodoPago("efectivo"); setTarjeta({ numero: "", vencimiento: "", cvv: "" });
  }, [open]);

  useEffect(() => {
    if (!open || !esSuperadmin) return;
    void FiltroFacturasController.empresas(session).then(setEmpresasOpt);
  }, [open, esSuperadmin, session]);

  useEffect(() => {
    if (!open) return;
    void FiltroFacturasController.sedes(session, empresaId || undefined).then((lista) => {
      setSedesOpt(lista);
      if (lista.length === 1) setSedeId(lista[0].id);
    });
  }, [open, session, empresaId]);

  /* El admin de sede no elige sede (la suya ya está fija) */
  const sedeEfectiva = sedesOpt.length > 0 ? sedeId : session?.sedeId || "";

  useEffect(() => {
    if (!open) return;
    const q = busquedaCliente.trim();
    if (q.length < 2) { setClientesOpt([]); return; }
    const empresaParaBuscar = esSuperadmin ? empresaId : session?.negocioId;
    const idTimeout = setTimeout(() => {
      void NuevaFacturaController.buscarClientes(q, empresaParaBuscar).then(setClientesOpt);
    }, 250);
    return () => clearTimeout(idTimeout);
  }, [open, busquedaCliente, esSuperadmin, empresaId, session?.negocioId]);

  useEffect(() => {
    if (!open || !sedeEfectiva) { setServicios([]); setProfesionales([]); return; }
    void NuevaFacturaController.servicios(sedeEfectiva, locale).then(setServicios);
    void NuevaFacturaController.profesionales(sedeEfectiva).then(setProfesionales);
    setServicioId(""); setProfesionalId("");
  }, [open, sedeEfectiva, locale]);

  const servicioElegido = servicios.find((s) => String(s.id) === servicioId);
  const precios: ApiPrice[] = servicioElegido?.prices || [];

  /* Al elegir el servicio (o cambiar de tarifa), se sugiere su precio;
     queda editable por si el cobro real fue distinto (descuento, etc.) */
  useEffect(() => {
    const tarifa = precios[precioIdx];
    if (tarifa) setPrecio(String(tarifa.amount));
  }, [servicioId, precioIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const duracion = precios[precioIdx]?.duration ?? 30;

  const faltaAlgo = useMemo(() => {
    if (!sedeEfectiva || !cliente || !servicioId || !profesionalId || !fecha || !hora) return true;
    if (!precio || Number(precio) <= 0) return true;
    if (metodoPago === "tarjeta" && (!tarjeta.numero || !tarjeta.vencimiento || !tarjeta.cvv)) return true;
    return false;
  }, [sedeEfectiva, cliente, servicioId, profesionalId, fecha, hora, precio, metodoPago, tarjeta]);

  const crear = async () => {
    if (faltaAlgo || !cliente) return;
    setCreando(true);
    try {
      await FacturasController.crear({
        sedeId: sedeEfectiva,
        clienteId: cliente.id,
        servicioId,
        profesionalId,
        fecha,
        hora,
        duracion,
        precio: Number(precio),
        metodoPago,
        tarjeta: metodoPago === "tarjeta" ? tarjeta : undefined,
      });
      toast(t("facturacion.nuevaCreada"), "success");
      onCreated();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t("facturacion.nuevaError");
      toast(msg, "error");
    } finally {
      setCreando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={560}>
      <ModalTitle>{t("facturacion.nuevaTitulo")}</ModalTitle>

      {esSuperadmin && (
        <Field label={t("facturacion.filterEmpresa")} htmlFor="nf-empresa">
          <select id="nf-empresa" value={empresaId} onChange={(e) => { setEmpresaId(e.target.value); setSedeId(""); }}>
            <option value="">{t("facturacion.nuevaEmpresaPlaceholder")}</option>
            {empresasOpt.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </Field>
      )}

      {sedesOpt.length > 0 && (
        <Field label={t("facturacion.filterSede")} htmlFor="nf-sede">
          <select id="nf-sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
            <option value="">{t("facturacion.nuevaSedePlaceholder")}</option>
            {sedesOpt.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
        </Field>
      )}

      <Field label={t("common.client")} htmlFor="nf-cliente" hint={t("facturacion.nuevaClienteHint")}>
        {cliente ? (
          <div className={styles.clienteElegido}>
            <span>{cliente.nombre} — {cliente.email}</span>
            <button type="button" onClick={() => { setCliente(null); setBusquedaCliente(""); }}>
              {t("common.change")}
            </button>
          </div>
        ) : (
          <>
            <input
              id="nf-cliente"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              placeholder={t("facturacion.nuevaClientePlaceholder")}
              disabled={!sedeEfectiva}
            />
            {clientesOpt.length > 0 && (
              <ul className={styles.clienteResultados}>
                {clientesOpt.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => { setCliente(c); setClientesOpt([]); }}>
                      {c.nombre} — {c.email}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Field>

      <Field label={t("common.service")} htmlFor="nf-servicio">
        <select id="nf-servicio" value={servicioId} onChange={(e) => { setServicioId(e.target.value); setPrecioIdx(0); }} disabled={!sedeEfectiva}>
          <option value="">{t("facturacion.nuevaServicioPlaceholder")}</option>
          {servicios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>

      {precios.length > 1 && (
        <Field label={t("facturacion.nuevaTarifa")} htmlFor="nf-tarifa">
          <select id="nf-tarifa" value={precioIdx} onChange={(e) => setPrecioIdx(Number(e.target.value))}>
            {precios.map((p, i) => (
              <option key={i} value={i}>{p.duration} min — {p.amount} {p.currency}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label={t("common.specialist")} htmlFor="nf-profesional">
        <select id="nf-profesional" value={profesionalId} onChange={(e) => setProfesionalId(e.target.value)} disabled={!sedeEfectiva}>
          <option value="">{t("facturacion.nuevaProfesionalPlaceholder")}</option>
          {profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </Field>

      <div className={styles.filaDoble}>
        <Field label={t("common.date")} htmlFor="nf-fecha">
          <input id="nf-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label={t("facturacion.nuevaHora")} htmlFor="nf-hora">
          <input id="nf-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </Field>
      </div>

      <Field label={t("gastos.total")} htmlFor="nf-precio">
        <input id="nf-precio" type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
      </Field>

      <Field label={t("facturacion.metodoPago")} htmlFor="nf-metodo">
        <select id="nf-metodo" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as "efectivo" | "tarjeta")}>
          <option value="efectivo">{t("facturacion.efectivo")}</option>
          <option value="tarjeta">{t("facturacion.tarjeta")}</option>
        </select>
      </Field>

      {metodoPago === "tarjeta" && (
        <div className={styles.filaDoble}>
          <Field label={t("facturacion.numeroTarjeta")} htmlFor="nf-tarjeta-numero">
            <input id="nf-tarjeta-numero" value={tarjeta.numero} onChange={(e) => setTarjeta({ ...tarjeta, numero: e.target.value })} placeholder="4242424242424242" />
          </Field>
          <Field label={t("facturacion.vencimientoTarjeta")} htmlFor="nf-tarjeta-venc">
            <input id="nf-tarjeta-venc" value={tarjeta.vencimiento} onChange={(e) => setTarjeta({ ...tarjeta, vencimiento: e.target.value })} placeholder="12/30" />
          </Field>
        </div>
      )}
      {metodoPago === "tarjeta" && (
        <Field label="CVV" htmlFor="nf-tarjeta-cvv">
          <input id="nf-tarjeta-cvv" value={tarjeta.cvv} onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value })} placeholder="123" />
        </Field>
      )}

      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={creando}>{t("common.cancel")}</Button>
        <Button onClick={() => void crear()} disabled={creando || faltaAlgo}>
          {creando ? t("facturacion.nuevaCreando") : t("facturacion.nuevaCrear")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
