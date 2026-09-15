import { Suspense } from "react";
import { ChartWorkspace } from "@/components/workspace/ChartWorkspace";

// useSearchParams() (added to ChartWorkspace to support the MOVE-instrument
// deep link from KpiMiniCell.tsx) requires a Suspense boundary during
// static prerendering — same pattern as /login and /sunday-read.
export default function ChartPage() {
  return (
    <Suspense fallback={null}>
      <ChartWorkspace />
    </Suspense>
  );
}
