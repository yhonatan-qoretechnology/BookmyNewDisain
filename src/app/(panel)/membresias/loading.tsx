/* Skeleton del plan: estado actual + comparativa */
import { SkeletonPage, SkPanel, SkSwitchRows, SkCards } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel><SkSwitchRows rows={3} /></SkPanel>
      <SkPanel><SkCards count={2} /></SkPanel>
    </SkeletonPage>
  );
}
