/* Skeleton de configuración: perfil, seguridad, notificaciones, apariencia */
import { SkeletonPage, SkPanel, SkForm, SkSwitchRows, skGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <div className={skGrid.cols2}>
        <SkPanel><SkForm fields={3} /></SkPanel>
        <SkPanel><SkForm fields={3} /></SkPanel>
        <SkPanel><SkSwitchRows rows={4} /></SkPanel>
        <SkPanel><SkSwitchRows rows={2} /></SkPanel>
      </div>
    </SkeletonPage>
  );
}
