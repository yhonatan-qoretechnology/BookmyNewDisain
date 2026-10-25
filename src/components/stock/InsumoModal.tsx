"use client";
/* ============================================================
   InsumoModal — ficha de un insumo: alta y edición
   ------------------------------------------------------------
   Los datos de siempre (nombre, categoría, unidad, precio y el
   máximo por defecto) y la ficha para la web del negocio:
   publicarlo, subcategoría, marca, distintivo, descripciones,
   especificaciones, opciones de capacidad y color, orden y fotos.

   En el alta las fotos se juntan en memoria y se suben en cuanto
   el insumo existe. Si algo falla después de crearlo, la ficha
   pasa a editarlo: reintentar no lo da de alta dos veces, y las
   fotos que no se hayan subido siguen ahí hasta el siguiente
   Guardar.

   Cabecera y botones fijos; solo scrollea la ficha (contentScroll).
============================================================ */
import { useState } from "react";
import type { EtiquetaInsumo, Insumo, InsumoDatos } from "@/models";
import {
  ETIQUETAS_INSUMO,
  MAX_DESCRIPCION,
  MAX_DESCRIPCION_LARGA,
  MAX_ESPECIFICACIONES,
  MAX_TEXTO_ESPECIFICACION,
  StockController,
  cantidadDe,
  precioDe,
  textoDePrecio,
} from "@/controllers/StockController";
import { MAX_ARCHIVOS_INSUMO } from "@/api/modules";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import ImageGallery from "@/components/ui/ImageGallery";
import ImagenesNuevas from "@/components/ui/ImagenesNuevas";
import Icon from "@/components/ui/Icon";
import styles from "./InsumoModal.module.css";

/** Fila editable de especificaciones; el id solo sirve de key estable */
interface FilaEspecificacion {
  id: number;
  nombre: string;
  valor: string;
}

/** Lo que se teclea, tal cual (los números como texto, como en el input) */
interface Formulario {
  nombre: string;
  categoria: string;
  unidad: string;
  precio: string;
  maxPorDefecto: string;
  publicadoWeb: boolean;
  subcategoria: string;
  marca: string;
  etiqueta: EtiquetaInsumo | "";
  descripcion: string;
  descripcionLarga: string;
  especificaciones: FilaEspecificacion[];
  conVariantes: boolean;
  ordenWeb: string;
}

/** Objetivo de existencias con el que el backend da de alta un insumo */
const MAX_POR_DEFECTO_INICIAL = 10;

let ultimaFila = 0;
const nuevaFila = (nombre = "", valor = ""): FilaEspecificacion => ({ id: ++ultimaFila, nombre, valor });

function aFormulario(i: Insumo | null): Formulario {
  return {
    nombre: i?.nombre ?? "",
    categoria: i?.categoria ?? "",
    unidad: i?.unidad ?? "",
    precio: i ? textoDePrecio(i.precioRef) : "",
    maxPorDefecto: String(i?.maxPorDefecto ?? MAX_POR_DEFECTO_INICIAL),
    publicadoWeb: i?.publicadoWeb ?? false,
    subcategoria: i?.subcategoria ?? "",
    marca: i?.marca ?? "",
    etiqueta: i?.etiqueta ?? "",
    descripcion: i?.descripcion ?? "",
    descripcionLarga: i?.descripcionLarga ?? "",
    especificaciones: (i?.especificaciones ?? []).map(([nombre, valor]) => nuevaFila(nombre, valor)),
    conVariantes: i?.conVariantes ?? false,
    ordenWeb: i?.ordenWeb != null ? String(i.ordenWeb) : "",
  };
}

export default function InsumoModal({
  open,
  insumo,
  onClose,
  onGuardado,
}: {
  open: boolean;
  /** null = alta de un insumo nuevo */
  insumo: Insumo | null;
  onClose: () => void;
  /** Se llama cada vez que algo cambia en el backend (guardar, fotos)
      para refrescar el catálogo */
  onGuardado: () => void | Promise<void>;
}) {
  const { session } = useSession();
  const { toast } = useUi();
  const { t } = useI18n();

  /* El estado nace de las props una sola vez: quien abre la ficha la
     monta de nuevo (key) en cada apertura. */
  const [actual, setActual] = useState<Insumo | null>(insumo);
  const [form, setForm] = useState<Formulario>(() => aFormulario(insumo));
  const [archivos, setArchivos] = useState<File[]>([]);
  const [filaNueva, setFilaNueva] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cambiarFilas = (cambio: (filas: FilaEspecificacion[]) => FilaEspecificacion[]) =>
    setForm((f) => ({ ...f, especificaciones: cambio(f.especificaciones) }));

  const añadirFila = () => {
    const fila = nuevaFila();
    setFilaNueva(fila.id);
    cambiarFilas((filas) => [...filas, fila]);
  };

  const mensajeDe = (e: unknown) => (e instanceof Error ? e.message : t("common.error"));

  /** Comprueba la ficha y la convierte al modelo; avisa y devuelve null si falta algo. */
  const validar = (): InsumoDatos | null => {
    if (!form.nombre.trim() || !form.categoria.trim() || !form.unidad.trim()) {
      toast(t("stock.fillRequired"), "error");
      return null;
    }
    const precio = precioDe(form.precio);
    const max = cantidadDe(form.maxPorDefecto);
    if (precio === null || max === null) {
      toast(t("stock.numbersInvalid"), "error");
      return null;
    }
    /* Sin precio, la web lo vendería gratis (el backend también lo rechaza) */
    if (form.publicadoWeb && precio <= 0) {
      toast(t("stock.publishNeedsPrice"), "error");
      return null;
    }
    const orden = form.ordenWeb.trim() ? Number(form.ordenWeb) : null;
    if (orden !== null && !(Number.isInteger(orden) && orden >= 0)) {
      toast(t("stock.orderInvalid"), "error");
      return null;
    }
    if (form.especificaciones.some((f) => !f.nombre.trim() !== !f.valor.trim())) {
      toast(t("stock.specIncomplete"), "error");
      return null;
    }
    return {
      nombre: form.nombre,
      categoria: form.categoria,
      unidad: form.unidad,
      precioRef: precio,
      maxPorDefecto: max,
      publicadoWeb: form.publicadoWeb,
      subcategoria: form.subcategoria,
      marca: form.marca,
      etiqueta: form.etiqueta || null,
      descripcion: form.descripcion,
      descripcionLarga: form.descripcionLarga,
      especificaciones: form.especificaciones.map((f): [string, string] => [f.nombre, f.valor]),
      conVariantes: form.conVariantes,
      ordenWeb: orden,
    };
  };

  const guardar = async () => {
    if (guardando) return;
    const datos = validar();
    if (!datos) return;
    setGuardando(true);
    /* Hasta dónde se llegó, para decir qué ha quedado a medias si algo falla */
    let guardado: Insumo | null = null;
    let soloFaltanFotos = false;
    try {
      guardado = actual
        ? await StockController.updateInsumo(session, actual.id, datos)
        : await StockController.addInsumo(session, datos);
      if (!actual) await StockController.completarAlta(session, guardado.id, datos);
      soloFaltanFotos = true;
      /* Las fotos del alta, o las que quedaron pendientes de un alta a medias */
      if (archivos.length) await StockController.subirImagenes(session, guardado.id, archivos);
    } catch (e) {
      if (!guardado) {
        /* No se ha guardado nada. El backend ya explica el motivo (nombre
           repetido, módulo de pago no contratado…): se enseña tal cual y
           la ficha sigue abierta. */
        toast(mensajeDe(e), "error");
        return;
      }
      /* Ya existe: la ficha pasa a editarlo, así que volver a guardar no
         intenta crearlo otra vez (el nombre se repetiría), y las fotos sin
         subir se quedan en ella para subirlas entonces. */
      setActual(guardado);
      const aviso = soloFaltanFotos
        ? "stock.photosPending"
        : archivos.length ? "stock.createdPartialPhotos" : "stock.createdPartial";
      /* Sin el punto final que suele traer el motivo: el aviso sigue con el suyo */
      toast(t(aviso, { motivo: mensajeDe(e).replace(/\.$/, "") }), "error");
      await onGuardado();
      return;
    } finally {
      setGuardando(false);
    }
    toast(t(actual ? "stock.insumoUpdated" : "stock.insumoCreated"), "success");
    await onGuardado();
    onClose();
  };

  /* En la edición cada foto va directa al backend (ImageGallery) */
  const subirFoto = async (file: File) => {
    const lista = await StockController.subirImagenes(session, actual!.id, [file]);
    void onGuardado();
    return lista;
  };
  const quitarFoto = async (ruta: string) => {
    const lista = await StockController.borrarImagen(session, actual!.id, ruta);
    void onGuardado();
    return lista;
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={640} contentScroll>
      <div className={styles.head}>
        <ModalTitle>{actual ? t("stock.editInsumoTitle") : t("stock.newInsumoTitle")}</ModalTitle>
        <ModalText>{actual ? t("stock.editInsumoSub") : t("stock.newInsumoSub")}</ModalText>
      </div>

      <div className={styles.scrollArea}>
        {/* ── Datos del insumo ── */}
        <section className={styles.bloque}>
          <h4>{t("stock.sectionData")}</h4>
          <Field label={t("stock.product")} htmlFor="in-nombre">
            <input
              id="in-nombre"
              value={form.nombre}
              maxLength={120}
              onChange={(e) => set("nombre", e.target.value)}
            />
          </Field>
          <div className={styles.rejilla}>
            <Field label={t("common.category")} htmlFor="in-cat">
              <input
                id="in-cat"
                value={form.categoria}
                maxLength={60}
                placeholder={t("stock.categoryPlaceholder")}
                onChange={(e) => set("categoria", e.target.value)}
              />
            </Field>
            <Field label={t("stock.unit")} htmlFor="in-unidad">
              <input
                id="in-unidad"
                value={form.unidad}
                maxLength={20}
                placeholder={t("stock.unitPlaceholder")}
                onChange={(e) => set("unidad", e.target.value)}
              />
            </Field>
            <Field label={t("stock.refPriceEur")} htmlFor="in-precio">
              {/* De texto: uno numérico se queda con lo que entiende el
                  navegador, y «1.469,90» llegaba como 1,4699 o vacío */}
              <input
                id="in-precio"
                inputMode="decimal"
                value={form.precio}
                placeholder="4,50"
                onChange={(e) => set("precio", e.target.value)}
              />
            </Field>
            <Field label={t("stock.maxDefault")} htmlFor="in-max" hint={t("stock.maxDefaultHint")}>
              <input
                id="in-max"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={form.maxPorDefecto}
                onChange={(e) => set("maxPorDefecto", e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* ── Ficha para la web del negocio ── */}
        <section className={styles.bloque}>
          <h4>{t("stock.sectionWeb")}</h4>
          {/* La fila entera es la zona de clic: el interruptor solo mide 24 px */}
          <label className={styles.switchRow}>
            <span className={styles.switchBody}>
              <b>{t("stock.publishWeb")}</b>
              <span>{t("stock.publishWebSub")}</span>
            </span>
            <Switch
              checked={form.publicadoWeb}
              onChange={(v) => set("publicadoWeb", v)}
              label={t("stock.publishWeb")}
            />
          </label>

          <div className={styles.rejilla}>
            <Field label={t("stock.subcategory")} htmlFor="in-subcat">
              <input
                id="in-subcat"
                value={form.subcategoria}
                maxLength={60}
                placeholder={t("stock.subcategoryPlaceholder")}
                onChange={(e) => set("subcategoria", e.target.value)}
              />
            </Field>
            <Field label={t("stock.brand")} htmlFor="in-marca">
              <input
                id="in-marca"
                value={form.marca}
                maxLength={60}
                placeholder={t("stock.brandPlaceholder")}
                onChange={(e) => set("marca", e.target.value)}
              />
            </Field>
            <Field label={t("stock.tag")} htmlFor="in-etiqueta">
              <select
                id="in-etiqueta"
                value={form.etiqueta}
                onChange={(e) => set("etiqueta", e.target.value as EtiquetaInsumo | "")}
              >
                <option value="">{t("stock.tagNone")}</option>
                {ETIQUETAS_INSUMO.map((etiqueta) => (
                  <option key={etiqueta} value={etiqueta}>{t(`stock.etiquetas.${etiqueta}`)}</option>
                ))}
              </select>
            </Field>
            <Field label={t("stock.webOrder")} htmlFor="in-orden" hint={t("stock.webOrderHint")}>
              <input
                id="in-orden"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.ordenWeb}
                onChange={(e) => set("ordenWeb", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label={t("stock.description")}
            htmlFor="in-desc"
            hint={t("stock.descriptionHint", { n: form.descripcion.length, max: MAX_DESCRIPCION })}
          >
            <textarea
              id="in-desc"
              className={styles.area}
              rows={3}
              maxLength={MAX_DESCRIPCION}
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </Field>
          <Field label={t("stock.descriptionLong")} htmlFor="in-desc-larga" hint={t("stock.descriptionLongHint")}>
            <textarea
              id="in-desc-larga"
              className={`${styles.area} ${styles.areaLarga}`}
              rows={5}
              maxLength={MAX_DESCRIPCION_LARGA}
              value={form.descripcionLarga}
              onChange={(e) => set("descripcionLarga", e.target.value)}
            />
          </Field>

          <fieldset className={styles.specs}>
            <legend>{t("stock.specs")}</legend>
            {form.especificaciones.map((fila, i) => (
              <div key={fila.id} className={styles.specRow}>
                <input
                  value={fila.nombre}
                  maxLength={MAX_TEXTO_ESPECIFICACION}
                  placeholder={t("stock.specName")}
                  aria-label={t("stock.specNameAria", { n: i + 1 })}
                  autoFocus={fila.id === filaNueva}
                  onChange={(e) => {
                    const nombre = e.target.value;
                    cambiarFilas((filas) => filas.map((f) => (f.id === fila.id ? { ...f, nombre } : f)));
                  }}
                />
                <input
                  value={fila.valor}
                  maxLength={MAX_TEXTO_ESPECIFICACION}
                  placeholder={t("stock.specValue")}
                  aria-label={t("stock.specValueAria", { n: i + 1 })}
                  onChange={(e) => {
                    const valor = e.target.value;
                    cambiarFilas((filas) => filas.map((f) => (f.id === fila.id ? { ...f, valor } : f)));
                  }}
                />
                <IconButton
                  type="button"
                  danger
                  aria-label={t("stock.specRemove", { n: i + 1 })}
                  onClick={() => cambiarFilas((filas) => filas.filter((f) => f.id !== fila.id))}
                >
                  <Icon name="trash" />
                </IconButton>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={añadirFila}
              disabled={form.especificaciones.length >= MAX_ESPECIFICACIONES}
            >
              <Icon name="plus" />
              {t("stock.specAdd")}
            </Button>
            <small className={styles.hint}>{t("stock.specsHint", { max: MAX_ESPECIFICACIONES })}</small>
          </fieldset>

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.conVariantes}
              onChange={(e) => set("conVariantes", e.target.checked)}
            />
            <span>
              <b>{t("stock.variants")}</b>
              <small>{t("stock.variantsHint")}</small>
            </span>
          </label>
        </section>

        {/* ── Fotos: en el alta se suben al crear; en la edición, al momento.
             Las que no se pudieron subir esperan al siguiente Guardar. ── */}
        <section className={styles.bloque}>
          {actual && !archivos.length ? (
            <ImageGallery
              label={t("stock.imagesLabel")}
              imagenes={actual.imagenes}
              onAdd={subirFoto}
              onRemove={quitarFoto}
            />
          ) : (
            <ImagenesNuevas
              label={t("stock.imagesLabel")}
              archivos={archivos}
              onChange={setArchivos}
              max={MAX_ARCHIVOS_INSUMO}
            />
          )}
          <small className={styles.hint}>
            {actual && archivos.length ? t("stock.imagesPendingHint") : t("stock.imagesHint")}
          </small>
        </section>
      </div>

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.cancel")}</Button>
        <Button block onClick={() => void guardar()} disabled={guardando}>
          {guardando ? t("common.saving") : actual ? t("common.save") : t("stock.createInsumo")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
