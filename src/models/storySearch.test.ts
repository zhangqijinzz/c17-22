import { describe, expect, it } from 'vitest';
import type { StoryDocument } from './story';
import { createStarterStory } from './story';
import { buildSnippet, groupSearchResults, normalizeKeyword, searchCategoryLabels, searchStory } from './storySearch';

function buildStory(): StoryDocument {
  const story = createStarterStory();
  story.clues.push({ id: 'clue-compass', title: '铜制罗盘上的刻痕', setupSceneId: 'scene-storm', payoffSceneId: '' });
  return story;
}

describe('story full-text search', () => {
  it('returns nothing for blank or whitespace-only queries', () => {
    expect(searchStory(buildStory(), '   ')).toEqual([]);
    expect(searchStory(buildStory(), '')).toEqual([]);
  });

  it('finds characters by name and role', () => {
    const results = searchStory(buildStory(), '守望人');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ category: 'character', ownerId: 'character-mira', fieldLabel: '身份' });
    expect(results[0].snippet).toContain('守望人');
  });

  it('finds scenes by title and description, and carries the scene order', () => {
    const results = searchStory(buildStory(), '背面写着');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ category: 'scene', fieldLabel: '描述', sceneOrder: 1 });
  });

  it('searches conflict text that the old filter could not reach', () => {
    const results = searchStory(buildStory(), '各执一词');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ category: 'conflict', ownerId: 'scene-storm', sceneOrder: 2 });
  });

  it('searches clue titles and reports their resolved state', () => {
    const results = searchStory(buildStory(), '刻痕');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ category: 'clue', ownerId: 'clue-compass', clueState: 'unresolved' });
  });

  it('groups results by category in a stable order', () => {
    const groups = groupSearchResults(searchStory(buildStory(), '的'));
    expect(groups.map((group) => searchCategoryLabels[group.category])).toEqual(['人物', '场景', '冲突', '伏笔']);
    expect(groups.every((group) => group.items.length > 0)).toBe(true);
  });

  it('normalizes keyword case and clips long snippets around the hit', () => {
    expect(normalizeKeyword('  MIRA ')).toBe('mira');
    const snippet = buildSnippet('零一二三四五六七八九十甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥', '庚');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toContain('庚');
  });
});
