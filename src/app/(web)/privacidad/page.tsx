import type { Metadata } from "next";
import LegalPage, { type BloqueLegal } from "@/components/web/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad · Bookmy",
  description: "Qué datos recopila Bookmy, cómo los usa y cuáles son tus derechos.",
  alternates: { canonical: "/privacidad" },
};

const BLOQUES: BloqueLegal[] = [
  { id: "s1", titulo: "s1Title", texto: "s1Text" },
  { id: "s2", titulo: "s2Title", texto: "s2Intro", lista: ["s2I1", "s2I2", "s2I3", "s2I4", "s2I5"] },
  { id: "s3", titulo: "s3Title", texto: "s3Intro", lista: ["s3I1", "s3I2", "s3I3", "s3I4", "s3I5"] },
  { id: "s4", titulo: "s4Title", texto: "s4Text" },
  { id: "s5", titulo: "s5Title", texto: "s5Text" },
  { id: "s6", titulo: "s6Title", texto: "s6Text" },
  { id: "s7", titulo: "s7Title", texto: "s7Intro", lista: ["s7I1", "s7I2", "s7I3", "s7I4", "s7I5", "s7I6"] },
  { id: "s8", titulo: "s8Title", texto: "s8Text" },
  { id: "s9", titulo: "s9Title", texto: "s9Text" },
  { id: "s10", titulo: "s10Title", texto: "s10Text" },
  { id: "s11", titulo: "s11Title", texto: "s11Text" },
];

export default function Page() {
  return <LegalPage seccion="privacy" bloques={BLOQUES} />;
}
