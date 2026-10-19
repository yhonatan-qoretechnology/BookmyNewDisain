/* Skeleton de "Mis reservas" (panel de especialista) */
import { SkeletonPage, SkPanel, SkToolbar, SkTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel>
        <SkToolbar actions={1} />
        <SkTable cols={7} rows={8} person={2} />
      </SkPanel>
    </SkeletonPage>
  );
}
