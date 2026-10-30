/* Skeleton de la ficha de seguimiento de un usuario */
import { SkeletonPage, SkPanel, SkStatGrid, SkTable, SkSwitchRows, skGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel><SkSwitchRows rows={1} /></SkPanel>
      <SkStatGrid count={4} />
      <div className={skGrid.cols2}>
        <SkPanel><SkSwitchRows rows={3} /></SkPanel>
        <SkPanel><SkSwitchRows rows={3} /></SkPanel>
      </div>
      <SkPanel><SkTable cols={6} rows={6} person={-1} /></SkPanel>
    </SkeletonPage>
  );
}
