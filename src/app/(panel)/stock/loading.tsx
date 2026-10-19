/* Skeleton de stock: pestañas + inventario */
import { SkeletonPage, SkPanel, SkTabs, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkTabs count={3} />
      <SkPanel head={false}>
        <SkToolbar actions={2} />
        <SkTable cols={5} rows={8} person={-1} />
      </SkPanel>
    </SkeletonPage>
  );
}
