"use client";
/* ============================================================
   GastoFormModal — "Agregar nuevo": formulario de gasto
   con adjunto de imagen del tickete (preview + base64)
============================================================ */
import { useState } from "react";
import {
  CATEGORIAS_GASTO,
  CategoriaGasto,
  Gasto,
  GastosController,
} from "@/controllers/FacturacionControllers";
import Modal from "./Modal";

const hoy = () => new Date().toISOString().slice(0, 10);

export default function GastoFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (g: Gasto) => void;
}) {
  const [gasto, setGasto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("Insumos");
  const [fecha, setFecha] = useState(hoy());
  const [total, setTotal] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [ticketNombre, setTicketNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const reset = () => {
    setGasto(""); setCategoria("Insumos"); setFecha(hoy());
    setTotal(""); setTicket(null); setTicketNombre(""); setError("");
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El tickete debe ser una imagen (JPG, PNG, WEBP…).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("La imagen supera 4 MB. Adjunta una más liviana.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setTicket(reader.result as string);
      setTicketNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    const monto = Number(total);
    if (!gasto.trim()) return setError("Escribe el nombre del gasto.");
    if (!fecha) return setError("Selecciona la fecha.");
    if (!monto || monto <= 0) return setError("El total debe ser mayor a 0.");
    setSaving(true);
    try {
      const nuevo = await GastosController.create({
        gasto: gasto.trim(),
        categoria,
        fecha,
        total: monto,
        ticket,
        ticketNombre: ticketNombre || undefined,
      });
      onSaved(nuevo);
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Agregar gasto" onClose={onClose} width={520}>
      <div className="gf-grid">
        <label className="gf-field gf-full">
          <span>Gasto</span>
          <input value={gasto} onChange={(e) => setGasto(e.target.value)} placeholder="Ej. Compra de detergentes" />
        </label>

        <label className="gf-field">
          <span>Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}>
            {CATEGORIAS_GASTO.map((c: CategoriaGasto) => (
              <option key={c} value={c}>{c === "Alimentacion" ? "Alimentación" : c}</option>
            ))}
          </select>
        </label>

        <label className="gf-field">
          <span>Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <label className="gf-field">
          <span>Total</span>
          <input type="number" min={0} step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0" />
        </label>

        <label className="gf-field">
          <span>Tickete (imagen)</span>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        {ticket && (
          <div className="gf-full gf-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ticket} alt="Vista previa del tickete" />
            <button className="gf-quitar" onClick={() => { setTicket(null); setTicketNombre(""); }}>
              Quitar imagen
            </button>
          </div>
        )}
      </div>

      {error && <p className="gf-error">{error}</p>}

      <div className="gf-actions">
        <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando…" : "Guardar gasto"}
        </button>
      </div>

      <style jsx>{`
        .gf-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .gf-full { grid-column:1 / -1; }
        .gf-field { display:flex; flex-direction:column; gap:6px; font-size:13px; }
        .gf-field span { color:var(--muted,#777); }
        .gf-field input, .gf-field select {
          padding:9px 10px; border:1px solid var(--border,#d9d9d9); border-radius:8px;
          font:inherit; background:var(--panel,#fff);
        }
        .gf-preview { position:relative; }
        .gf-preview img { width:100%; max-height:220px; object-fit:contain; border-radius:8px; border:1px solid var(--border,#eee); background:#fafafa; }
        .gf-quitar { position:absolute; top:8px; right:8px; border:none; background:rgba(0,0,0,.6); color:#fff; border-radius:6px; padding:4px 10px; font-size:12px; cursor:pointer; }
        .gf-error { color:#c0392b; font-size:13px; margin:10px 0 0; }
        .gf-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:20px; }
      `}</style>
    </Modal>
  );
}
