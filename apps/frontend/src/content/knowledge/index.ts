import type { FamilyId } from "@gold-terminal/contracts";
import { KNOWLEDGE_CHAPTERS_F1_F3 } from "./chaptersF1F3";
import { KNOWLEDGE_CHAPTERS_F4_F6 } from "./chaptersF4F6";
import { KNOWLEDGE_CHAPTERS_F7_F10 } from "./chaptersF7F10";
import { KNOWLEDGE_CHAPTERS_F11 } from "./chaptersF11";
import { KNOWLEDGE_CHAPTERS_F12_F13 } from "./chaptersF12F13";
import { FAMILY_KNOWLEDGE_SLUG } from "./knowledgeMap";

export interface LocalizedText { EN: string; FR: string }
export interface KnowledgeExampleLike { id: string; title: LocalizedText; setup: LocalizedText; steps: LocalizedText[]; conclusion: LocalizedText }
export interface KnowledgeSectionLike { id: string; title: LocalizedText; summary: LocalizedText; paragraphs?: LocalizedText[]; bullets?: LocalizedText[]; examples?: KnowledgeExampleLike[] }
export interface KnowledgeChapterLike {
  id: string; familyId: FamilyId; title: LocalizedText; description: LocalizedText;
  learningObjectives: LocalizedText[]; sections: KnowledgeSectionLike[]; relatedTopics: string[];
  glossary: Array<{ id: string; term: string; definition: LocalizedText }>; takeaways: LocalizedText[];
}

export const KNOWLEDGE_CHAPTERS: readonly KnowledgeChapterLike[] = [
  ...(KNOWLEDGE_CHAPTERS_F1_F3 as readonly KnowledgeChapterLike[]),
  ...(KNOWLEDGE_CHAPTERS_F4_F6 as readonly KnowledgeChapterLike[]),
  ...(KNOWLEDGE_CHAPTERS_F7_F10 as readonly KnowledgeChapterLike[]),
  ...(KNOWLEDGE_CHAPTERS_F11 as readonly KnowledgeChapterLike[]),
  ...(KNOWLEDGE_CHAPTERS_F12_F13 as readonly KnowledgeChapterLike[]),
];

export function getKnowledgeChapterBySlug(slug: string): KnowledgeChapterLike | undefined {
  return KNOWLEDGE_CHAPTERS.find((chapter) => FAMILY_KNOWLEDGE_SLUG[chapter.familyId] === slug);
}
