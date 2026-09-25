import type { Metadata } from "next";
import PlanPage from "@/components/web/PlanPage";

export const metadata: Metadata = {
  title: "Bookmy Free · Empieza gratis a gestionar tus reservas",
  description:
    "El plan gratuito de Bookmy: agenda digital 24/7, confirmaciones automáticas, perfil público y acceso desde móvil o tablet.",
  alternates: { canonical: "/bookmy-free" },
};

export default function Page() {
  return <PlanPage plan="free" />;
}
