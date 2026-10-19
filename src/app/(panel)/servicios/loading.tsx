/* Skeleton del catálogo de servicios (tarjetas con imagen) */
import { SkeletonPage, SkPanel, SkToolbar, SkCards } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar actions={1} />
        <SkCards count={8} image />
      </SkPanel>
    </SkeletonPage>
  );
}
