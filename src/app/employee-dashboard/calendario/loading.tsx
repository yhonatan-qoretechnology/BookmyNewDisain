/* Skeleton del calendario de la especialista */
import { SkeletonPage, SkPanel, SkCalendar } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkCalendar />
      </SkPanel>
    </SkeletonPage>
  );
}
