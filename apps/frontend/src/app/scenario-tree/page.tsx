import { redirect } from "next/navigation";

// The scenario graph lives in Histoire du marché; keep old bookmarks usable.
export default function ScenarioTreePage() {
  redirect("/sunday-read");
}
