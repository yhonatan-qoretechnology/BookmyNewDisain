/* Skeleton de reseñas (tarjetas con autor) */
import { SkeletonPage, SkPanel, SkToolbar, SkCards } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar />
        <SkCards count={6} avatar />
      </SkPanel>
    </SkeletonPage>
  );
}
