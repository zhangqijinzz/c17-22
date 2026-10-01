import type { StoryDocument } from './story';
import { orderedScenes } from './storyRules';

export type SearchCategory = 'character' | 'scene' | 'conflict' | 'clue';

export const searchCategoryLabels: Record<SearchCategory, string> = {
  character: '人物',
  scene: '场景',
  conflict: '冲突',
  clue: '伏笔',
};

export const searchCategoryOrder: SearchCategory[] = ['character', 'scene', 'conflict', 'clue'];

export interface StorySearchResult {
  id: string;
  category: SearchCategory;
  /** 结果所属人物 / 场景 / 伏笔的 id，用于定位高亮 */
  ownerId: string;
  title: string;
  fieldLabel: string;
  snippet: string;
  sceneOrder?: number;
  clueState?: 'resolved' | 'unresolved';
}

const SNIPPET_RADIUS = 14;

/**
 * 与搜索框完全一致的切词匹配：去掉空白后整体作为一个子串，
 * 保证中文内容「打一个字也能命中」。
 */
export function normalizeKeyword(raw: string): string {
  return raw.trim().toLowerCase();
}

export function matchesText(text: string, keyword: string): boolean {
  return keyword !== '' && text.toLowerCase().includes(keyword);
}

/** 从命中位置向两侧截取片段，保留命中的是哪几个字的上下文。 */
export function buildSnippet(text: string, keyword: string): string {
  const index = text.toLowerCase().indexOf(keyword);
  if (index < 0) return text;
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + keyword.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function pushIfMatch(
  results: StorySearchResult[],
  category: SearchCategory,
  ownerId: string,
  title: string,
  fieldLabel: string,
  fieldText: string,
  keyword: string,
  extra?: Partial<StorySearchResult>,
): void {
  if (!matchesText(fieldText, keyword)) return;
  results.push({
    id: `${category}-${ownerId}-${fieldLabel}`,
    category,
    ownerId,
    title,
    fieldLabel,
    snippet: buildSnippet(fieldText, keyword),
    ...extra,
  });
}

/**
 * 全文检索：覆盖人物（姓名 / 身份）、场景（标题 / 描述）、
 * 冲突（核心冲突正文）、伏笔（标题），结果按类别归拢。
 */
export function searchStory(story: StoryDocument, rawKeyword: string): StorySearchResult[] {
  const keyword = normalizeKeyword(rawKeyword);
  if (keyword === '') return [];

  const results: StorySearchResult[] = [];

  for (const character of story.characters) {
    pushIfMatch(results, 'character', character.id, character.name, '姓名', character.name, keyword);
    pushIfMatch(results, 'character', character.id, character.name, '身份', character.role, keyword);
  }

  const scenes = orderedScenes(story);
  scenes.forEach((scene, index) => {
    const order = index + 1;
    pushIfMatch(results, 'scene', scene.id, scene.title, '标题', scene.title, keyword, { sceneOrder: order });
    pushIfMatch(results, 'scene', scene.id, scene.title, '描述', scene.summary, keyword, { sceneOrder: order });
    pushIfMatch(results, 'conflict', scene.id, scene.title, '核心冲突', scene.conflict, keyword, { sceneOrder: order });
  });

  for (const clue of story.clues) {
    pushIfMatch(results, 'clue', clue.id, clue.title, '标题', clue.title, keyword, {
      clueState: clue.payoffSceneId ? 'resolved' : 'unresolved',
    });
  }

  return results;
}

export function groupSearchResults(results: StorySearchResult[]): { category: SearchCategory; items: StorySearchResult[] }[] {
  return searchCategoryOrder
    .map((category) => ({ category, items: results.filter((result) => result.category === category) }))
    .filter((group) => group.items.length > 0);
}
