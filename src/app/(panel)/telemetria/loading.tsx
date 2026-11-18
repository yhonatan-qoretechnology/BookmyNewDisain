/* Skeleton de carga de la ruta */
import { SkeletonPage, SkPanel, SkStatGrid, SkToolbar, SkTable, SkChart } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkStatGrid count={4} />
      <SkPanel><SkChart bars={12} /></SkPanel>
    </SkeletonPage>
  );
}
