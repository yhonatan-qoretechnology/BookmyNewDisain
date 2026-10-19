/* Skeleton del calendario mensual */
import { SkeletonPage, SkPanel, SkCalendar } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel actions={1}>
        <SkCalendar />
      </SkPanel>
    </SkeletonPage>
  );
}
