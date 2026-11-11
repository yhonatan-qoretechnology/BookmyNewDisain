/* ============================================================
   CategoriasController — catálogo global de categorías de servicio
   (CategoryModule del backend; crear, editar y borrar es solo del
   superadmin).
     GET    /categories?language=all   → con todas sus traducciones
     POST   /categories                 → { translations: [...] }
     PUT    /categories/:id             → idem (reemplaza las traducciones)
     PATCH  /categories/:id/image       → multipart { image }
     DELETE /categories/:id
============================================================ */
import { http } from "@/api/http";
import { EP } from "@/api/endpoints";
import type { ApiCategory } from "@/api/types";

/** Una categoría con sus textos en español e inglés. */
export interface CategoriaGlobal {
  id: number;
  imagen: string | null;
  nombreEs: string;
  descripcionEs: string;
  nombreEn: string;
  descripcionEn: string;
}

export interface CategoriaInput {
  nombreEs: string;
  descripcionEs: string;
  nombreEn: string;
  descripcionEn: string;
}

function mapCategoria(c: ApiCategory): CategoriaGlobal {
  const tr = (lang: string) => c.translations.find((x) => x.language === lang);
  const es = tr("es");
  const en = tr("en");
  return {
    id: c.id,
    imagen: c.image || null,
    nombreEs: es?.name || "",
    descripcionEs: es?.description || "",
    nombreEn: en?.name || "",
    descripcionEn: en?.description || "",
  };
}

/** Traducciones a mandar: solo los idiomas con nombre. */
function traducciones(input: CategoriaInput) {
  const out: Array<{ language: string; name: string; description?: string }> = [];
  if (input.nombreEs.trim()) {
    out.push({ language: "es", name: input.nombreEs.trim(), description: input.descripcionEs.trim() || undefined });
  }
  if (input.nombreEn.trim()) {
    out.push({ language: "en", name: input.nombreEn.trim(), description: input.descripcionEn.trim() || undefined });
  }
  return out;
}

export const CategoriasController = {
  async listar(): Promise<CategoriaGlobal[]> {
    const lista = await http.get<ApiCategory[]>(`${EP.categories}?language=all`);
    return (lista || [])
      .map(mapCategoria)
      .sort((a, b) => (a.nombreEs || a.nombreEn).localeCompare(b.nombreEs || b.nombreEn));
  },

  /** @throws ApiError si el nombre ya existe o el backend lo rechaza. */
  async crear(input: CategoriaInput, imagen?: File | null): Promise<void> {
    const creada = await http.post<ApiCategory>(EP.categories, { translations: traducciones(input) });
    if (imagen && creada?.id) await CategoriasController.cambiarImagen(creada.id, imagen);
  },

  async actualizar(id: number, input: CategoriaInput, imagen?: File | null): Promise<void> {
    await http.put(`${EP.categories}/${id}`, { translations: traducciones(input) });
    if (imagen) await CategoriasController.cambiarImagen(id, imagen);
  },

  async cambiarImagen(id: number, imagen: File): Promise<void> {
    const form = new FormData();
    form.append("image", imagen);
    await http.patchForm(EP.categoryImage(id), form);
  },

  /** @throws ApiError si la categoría todavía tiene servicios. */
  async eliminar(id: number): Promise<void> {
    await http.delete(`${EP.categories}/${id}`);
  },

  /**
   * Traducción automática de un texto corto (MyMemory, la misma que usaba
   * el panel anterior). Solo se llama al pulsar «Traducir»; devuelve
   * null si el servicio no responde.
   */
  async traducir(texto: string, de: "es" | "en", a: "es" | "en"): Promise<string | null> {
    if (!texto.trim()) return "";
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto.trim())}&langpair=${de}|${a}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
      const txt = data.responseData?.translatedText;
      return data.responseStatus === 200 && txt ? txt : null;
    } catch {
      return null;
    }
  },
};
