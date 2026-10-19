/* Skeleton de empresas (superadmin) */
import { SkeletonPage, SkPanel, SkToolbar, SkCards } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar actions={1} />
        <SkCards count={6} avatar />
      </SkPanel>
    </SkeletonPage>
  );
}
