/* Skeleton del dashboard: KPIs, reservas de hoy y calendario */
import { SkeletonPage, SkStatGrid, SkPanel, SkTable, SkCalendar, SkForm, skGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkStatGrid count={4} />
      <SkPanel actions={1}>
        <SkTable cols={7} rows={5} person={1} />
      </SkPanel>
      <div className={skGrid.sideMain}>
        <SkPanel><SkForm fields={3} /></SkPanel>
        <SkPanel><SkCalendar /></SkPanel>
      </div>
    </SkeletonPage>
  );
}
