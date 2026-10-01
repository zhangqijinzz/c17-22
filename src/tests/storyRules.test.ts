import { describe, expect, it } from 'vitest';
import { createStarterStory } from '../models/story';
import { getStats, getTimelineWarning, orderedScenes, sanitizeStory, searchStory, validateName } from '../models/storyRules';

describe('story domain rules', () => {
  it('sorts scenes and calculates unresolved clues', () => {
    const story = createStarterStory();
    story.scenes = [...story.scenes].reverse();
    expect(orderedScenes(story).map((scene) => scene.title)).toEqual(['旧港口的来信', '风暴前夜']);
    expect(getStats(story)).toMatchObject({ characters: 2, scenes: 2, clues: 1, unresolvedClues: 1, completion: 80 });
  });

  it('guards invalid names and duplicate timeline orders', () => {
    const story = createStarterStory();
    story.scenes[1].order = story.scenes[0].order;
    expect(validateName(' ')).toBe('至少输入 2 个字');
    expect(getTimelineWarning(story)).toContain('重复');
  });

  it('rejects corrupt persisted documents', () => {
    expect(sanitizeStory('{bad json}')).toBeNull();
    expect(sanitizeStory({ version: 99 })).toBeNull();
    expect(sanitizeStory(createStarterStory())).not.toBeNull();
  });

  it('searches characters, scenes, conflicts and clues with grouped results', () => {
    const story = createStarterStory();

    const byCharacter = searchStory(story, '米拉');
    expect(byCharacter.characters.map((match) => match.field)).toEqual(['名称']);
    expect(byCharacter.scenes.map((match) => match.field)).toEqual(['摘要']);
    expect(byCharacter.total).toBe(2);

    const byRole = searchStory(story, '守望人');
    expect(byRole.characters[0]).toMatchObject({ field: '身份', text: '灯塔守望人' });

    const byConflict = searchStory(story, '不可能寄出');
    expect(byConflict.conflicts).toHaveLength(1);
    expect(byConflict.conflicts[0]).toMatchObject({ sceneId: 'scene-old-harbor', meta: 'SCENE 01' });

    const byClue = searchStory(story, '潮汐表');
    expect(byClue.clues).toHaveLength(1);
    expect(byClue.clues[0].meta).toContain('待回收');
    expect(byClue.scenes.some((match) => match.field === '摘要')).toBe(true);
    expect(byClue.total).toBe(byClue.characters.length + byClue.scenes.length + byClue.conflicts.length + byClue.clues.length);
  });

  it('returns an understandable empty result for blank or unmatched queries', () => {
    const story = createStarterStory();
    const blank = searchStory(story, '   ');
    expect(blank.total).toBe(0);
    const missing = searchStory(story, '不存在的词');
    expect(missing.total).toBe(0);
    expect(missing.query).toBe('不存在的词');
    expect(missing.characters).toEqual([]);
    expect(missing.scenes).toEqual([]);
    expect(missing.conflicts).toEqual([]);
    expect(missing.clues).toEqual([]);
  });
});
