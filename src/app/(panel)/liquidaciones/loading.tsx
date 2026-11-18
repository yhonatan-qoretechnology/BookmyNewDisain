/* Skeleton de carga de la ruta */
import { SkeletonPage, SkPanel, SkStatGrid, SkToolbar, SkTable, SkChart } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkStatGrid count={3} />
      <SkPanel>
        <SkToolbar filters={1} />
        <SkTable cols={5} rows={6} person={-1} />
      </SkPanel>
    </SkeletonPage>
  );
}
