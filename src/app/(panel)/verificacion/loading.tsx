/* Skeleton de verificación (KYC) */
import { SkeletonPage, SkPanel, SkSteps, SkForm } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkSteps count={4} />
        <SkForm fields={4} />
      </SkPanel>
    </SkeletonPage>
  );
}
