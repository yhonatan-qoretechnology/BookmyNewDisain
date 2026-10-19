/* Skeleton de facturas: KPIs + listado filtrable */
import { SkeletonPage, SkStatGrid, SkPanel, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkStatGrid count={4} />
      <SkPanel>
        <SkToolbar filters={2} />
        <SkTable cols={6} rows={7} person={1} />
      </SkPanel>
    </SkeletonPage>
  );
}
