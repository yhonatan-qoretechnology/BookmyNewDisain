/* Skeleton del listado de clientes */
import { SkeletonPage, SkPanel, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar />
        <SkTable cols={6} rows={8} person={0} />
      </SkPanel>
    </SkeletonPage>
  );
}
