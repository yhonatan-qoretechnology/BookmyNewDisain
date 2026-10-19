/* Skeleton de la edición de una sede: pestañas + formulario */
import { SkeletonPage, SkPanel, SkTabs, SkForm, skGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkPanel actions={1}>
        <SkTabs count={4} />
        <div className={skGrid.cols2}>
          <SkForm fields={4} />
          <SkForm fields={4} />
        </div>
      </SkPanel>
    </SkeletonPage>
  );
}
