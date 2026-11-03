/* Skeleton de ayuda: cabecera + tarjetas de guías */
import { SkeletonPage, SkCards } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkCards count={6} />
    </SkeletonPage>
  );
}
