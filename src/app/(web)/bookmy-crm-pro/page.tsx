import type { Metadata } from "next";
import PlanPage from "@/components/web/PlanPage";

export const metadata: Metadata = {
  title: "Bookmy CRM Pro · Gestiona todo tu negocio",
  description:
    "Facturación, inventario, CRM de clientes, estadísticas en tiempo real y varias sedes desde un único panel.",
  alternates: { canonical: "/bookmy-crm-pro" },
};

export default function Page() {
  return <PlanPage plan="pro" />;
}
