import { notFound } from "next/navigation";
import { KnowledgeChapterView } from "@/components/knowledge/KnowledgeChapterView";
import { getKnowledgeChapterBySlug, KNOWLEDGE_CHAPTERS } from "@/content/knowledge";
import { FAMILY_KNOWLEDGE_SLUG } from "@/content/knowledge/knowledgeMap";

export function generateStaticParams() { return KNOWLEDGE_CHAPTERS.map((chapter) => ({ slug: FAMILY_KNOWLEDGE_SLUG[chapter.familyId] })); }
export default async function KnowledgeChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const chapter = getKnowledgeChapterBySlug((await params).slug);
  if (!chapter) notFound();
  return <KnowledgeChapterView chapter={chapter} />;
}
