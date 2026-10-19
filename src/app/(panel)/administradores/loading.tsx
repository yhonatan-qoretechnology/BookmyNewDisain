/* Skeleton de administradores (superadmin) */
import { SkeletonPage, SkPanel, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar actions={1} />
        <SkTable cols={7} rows={7} person={0} />
      </SkPanel>
    </SkeletonPage>
  );
}
