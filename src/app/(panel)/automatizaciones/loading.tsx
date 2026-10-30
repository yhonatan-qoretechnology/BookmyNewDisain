/* Skeleton de automatizaciones: pestañas + tabla */
import { SkeletonPage, SkPanel, SkTabs, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkTabs count={3} />
      <SkPanel>
        <SkToolbar actions={1} />
        <SkTable cols={6} rows={6} person={-1} />
      </SkPanel>
    </SkeletonPage>
  );
}
