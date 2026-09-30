import type { Metadata } from "next";
import LegalPage, { type BloqueLegal } from "@/components/web/LegalPage";

export const metadata: Metadata = {
  title: "Política de cookies · Bookmy",
  description: "Qué cookies usa Bookmy, para qué sirven y cómo gestionar tus preferencias.",
  alternates: { canonical: "/cookies" },
};

const BLOQUES: BloqueLegal[] = [
  { id: "c1", titulo: "s1Title", texto: "s1Text" },
  {
    id: "c2",
    titulo: "s2Title",
    texto: "s2Text",
    tabla: {
      cabeceras: ["colType", "colPurpose", "colDuration"],
      filas: [
        ["row1Type", "row1Purpose", "row1Duration"],
        ["row2Type", "row2Purpose", "row2Duration"],
        ["row3Type", "row3Purpose", "row3Duration"],
        ["row4Type", "row4Purpose", "row4Duration"],
      ],
    },
  },
  { id: "c3", titulo: "s3Title", texto: "s3Text" },
  { id: "c4", titulo: "s4Title", texto: "s4Text", botonCookies: "s4Btn" },
  { id: "c5", titulo: "s5Title", texto: "s5Text" },
  { id: "c6", titulo: "s6Title", texto: "s6Text" },
];

export default function Page() {
  return <LegalPage seccion="cookies" bloques={BLOQUES} />;
}
