import type { StoryDocument, StoryScene, StoryStats } from './story';

export function orderedScenes(story: StoryDocument): StoryScene[] {
  return [...story.scenes].sort((a, b) => a.order - b.order);
}

export type SearchCategory = 'character' | 'scene' | 'conflict' | 'clue';

export interface StorySearchMatch {
  category: SearchCategory;
  id: string;
  sceneId?: string;
  field: string;
  label: string;
  text: string;
  meta: string;
}

export interface StorySearchResults {
  query: string;
  characters: StorySearchMatch[];
  scenes: StorySearchMatch[];
  conflicts: StorySearchMatch[];
  clues: StorySearchMatch[];
  total: number;
}

export function searchStory(story: StoryDocument, rawQuery: string): StorySearchResults {
  const query = rawQuery.trim();
  const results: StorySearchResults = { query, characters: [], scenes: [], conflicts: [], clues: [], total: 0 };
  const needle = query.toLowerCase();
  if (!needle) return results;
  const hit = (value: string) => value.toLowerCase().includes(needle);
  const sceneTitle = (sceneId: string) => story.scenes.find((scene) => scene.id === sceneId)?.title ?? '未知场景';

  for (const character of story.characters) {
    if (hit(character.name)) {
      results.characters.push({ category: 'character', id: character.id, field: '名称', label: character.name, text: character.name, meta: character.role });
    }
    if (hit(character.role)) {
      results.characters.push({ category: 'character', id: character.id, field: '身份', label: character.name, text: character.role, meta: '' });
    }
  }

  const scenes = orderedScenes(story);
  scenes.forEach((scene, index) => {
    const sceneMeta = `SCENE ${String(index + 1).padStart(2, '0')}`;
    if (hit(scene.title)) {
      results.scenes.push({ category: 'scene', id: scene.id, sceneId: scene.id, field: '标题', label: scene.title, text: scene.title, meta: sceneMeta });
    }
    if (hit(scene.summary)) {
      results.scenes.push({ category: 'scene', id: scene.id, sceneId: scene.id, field: '摘要', label: scene.title, text: scene.summary, meta: sceneMeta });
    }
    if (scene.conflict && hit(scene.conflict)) {
      results.conflicts.push({ category: 'conflict', id: scene.id, sceneId: scene.id, field: '冲突', label: scene.title, text: scene.conflict, meta: sceneMeta });
    }
  });

  for (const clue of story.clues) {
    if (hit(clue.title)) {
      const payoff = clue.payoffSceneId ? sceneTitle(clue.payoffSceneId) : '待回收';
      results.clues.push({ category: 'clue', id: clue.id, sceneId: clue.setupSceneId, field: '伏笔', label: clue.title, text: clue.title, meta: `${sceneTitle(clue.setupSceneId)} → ${payoff}` });
    }
  }

  results.total = results.characters.length + results.scenes.length + results.conflicts.length + results.clues.length;
  return results;
}

export function getStats(story: StoryDocument): StoryStats {
  const unresolvedClues = story.clues.filter((clue) => clue.payoffSceneId === '').length;
  const totalSignals = story.characters.length + story.scenes.length + story.clues.length;
  const completedSignals = story.characters.length + story.scenes.length + (story.clues.length - unresolvedClues);
  const completion = totalSignals === 0 ? 0 : Math.round((completedSignals / totalSignals) * 100);
  return {
    characters: story.characters.length,
    scenes: story.scenes.length,
    clues: story.clues.length,
    unresolvedClues,
    completion,
  };
}

export function validateName(value: string): string {
  const cleanValue = value.trim();
  return cleanValue.length < 2 ? '至少输入 2 个字' : cleanValue;
}

export function getTimelineWarning(story: StoryDocument): string | null {
  const orders = story.scenes.map((scene) => scene.order);
  return new Set(orders).size !== orders.length ? '时间线存在重复顺序，请重新排列。' : null;
}

export function sanitizeStory(input: unknown): StoryDocument | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<StoryDocument>;
  if (
    candidate.version !== 1 ||
    typeof candidate.id !== 'string' ||
    typeof candidate.title !== 'string' ||
    !Array.isArray(candidate.characters) ||
    !Array.isArray(candidate.scenes) ||
    !Array.isArray(candidate.clues)
  ) {
    return null;
  }
  return candidate as StoryDocument;
}
