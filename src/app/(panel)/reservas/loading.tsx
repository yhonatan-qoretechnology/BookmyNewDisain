/* Skeleton del listado de reservas */
import { SkeletonPage, SkPanel, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar filters={1} actions={1} />
        <SkTable cols={8} rows={8} person={2} />
      </SkPanel>
    </SkeletonPage>
  );
}
