/* Skeleton del asistente de nueva reserva */
import { SkeletonPage, SkPanel, SkSteps, SkCards } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkSteps count={5} />
        <SkCards count={6} avatar />
      </SkPanel>
    </SkeletonPage>
  );
}
