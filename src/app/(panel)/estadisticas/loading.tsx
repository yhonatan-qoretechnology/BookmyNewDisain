/* Skeleton de estadísticas: KPIs y paneles de gráficos */
import { SkeletonPage, SkPanel, SkChart, SkTable, Bone, skGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Bone w={220} h={40} shape="pill" />
        <Bone w={260} h={40} shape="pill" />
      </div>
      <div className={skGrid.cols4}>
        {Array.from({ length: 4 }, (_, i) => (
          <SkPanel key={i} head={false}>
            <Bone w="50%" h={12} />
            <Bone w="70%" h={28} style={{ marginTop: 12 }} />
          </SkPanel>
        ))}
      </div>
      <div className={skGrid.cols2}>
        <SkPanel><SkChart bars={12} /></SkPanel>
        <SkPanel><SkChart bars={7} /></SkPanel>
      </div>
      <SkPanel><SkTable cols={4} rows={5} person={-1} /></SkPanel>
    </SkeletonPage>
  );
}
