/* Skeleton de referidos: tarjetas de resumen + tablas */
import { SkeletonPage, SkPanel, SkStatGrid, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkStatGrid count={4} />
      <SkPanel><SkTable cols={5} rows={6} person={-1} /></SkPanel>
    </SkeletonPage>
  );
}
