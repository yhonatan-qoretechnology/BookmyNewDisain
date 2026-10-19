/* Skeleton de seguimiento de accesos (superadmin) */
import { SkeletonPage, SkStatGrid, SkPanel, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkStatGrid count={4} />
      <SkPanel>
        <SkToolbar filters={3} />
        <SkTable cols={8} rows={8} person={0} />
      </SkPanel>
    </SkeletonPage>
  );
}
