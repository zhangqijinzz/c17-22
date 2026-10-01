import { describe, expect, it, vi } from 'vitest';
import { createStarterStory } from '../models/story';
import { LocalStoryRepository } from '../repositories/storyRepository';
import { MemoryStorageService } from '../services/storageService';
import { StoryViewModel } from '../viewmodels/storyViewModel';

describe('story view model', () => {
  it('initializes, edits, persists, and restores the main flow', () => {
    const repository = new LocalStoryRepository(new MemoryStorageService());
    const viewModel = new StoryViewModel(repository);
    viewModel.initialize();
    expect(viewModel.snapshot.status).toBe('ready');
    viewModel.addCharacter('阿洛', '修复师');
    viewModel.addScene('地下档案室', '他们找到被隐藏的航海日志。');
    const scene = viewModel.selectedScene;
    expect(scene?.title).toBe('地下档案室');
    viewModel.toggleCharacter(scene?.id ?? '', viewModel.snapshot.story?.characters[2]?.id ?? '');
    expect(viewModel.snapshot.stats.characters).toBe(3);

    const restored = new StoryViewModel(repository);
    restored.initialize();
    expect(restored.snapshot.story?.scenes.some((item) => item.title === '地下档案室')).toBe(true);
    expect(restored.snapshot.story?.characters.some((item) => item.name === '阿洛')).toBe(true);
  });

  it('shows recoverable validation feedback and resets corrupt storage', () => {
    const storage = new MemoryStorageService();
    storage.write('{broken');
    const viewModel = new StoryViewModel(new LocalStoryRepository(storage));
    viewModel.initialize();
    viewModel.addCharacter(' ', '');
    expect(viewModel.snapshot.notice).toContain('至少');
    viewModel.resetProject();
    expect(viewModel.snapshot.story?.id).toBe(createStarterStory().id);
  });

  it('searches all categories without disturbing timeline order or selection', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()), 0);
    viewModel.initialize();
    viewModel.selectScene('scene-storm');
    const orderBefore = viewModel.timelineScenes.map((scene) => scene.id);

    viewModel.setSearch('不可能寄出');
    const results = viewModel.snapshot.searchResults;
    expect(results?.conflicts).toHaveLength(1);
    expect(viewModel.timelineScenes.map((scene) => scene.id)).toEqual(orderBefore);
    expect(viewModel.snapshot.story?.selectedSceneId).toBe('scene-storm');

    viewModel.setSearch('潮汐表');
    expect(viewModel.snapshot.searchResults?.clues).toHaveLength(1);
    expect(viewModel.snapshot.searchResults?.scenes.length).toBeGreaterThan(0);
    expect(viewModel.timelineScenes.map((scene) => scene.id)).toEqual(orderBefore);
    expect(viewModel.snapshot.story?.selectedSceneId).toBe('scene-storm');
  });

  it('opens a result by jumping to its target and restores the view on clear', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()), 0);
    viewModel.initialize();
    const orderBefore = viewModel.timelineScenes.map((scene) => scene.id);

    viewModel.setSearch('各执一词');
    const conflict = viewModel.snapshot.searchResults?.conflicts[0];
    expect(conflict?.sceneId).toBe('scene-storm');
    if (conflict) viewModel.openSearchResult(conflict);
    expect(viewModel.snapshot.story?.selectedSceneId).toBe('scene-storm');
    expect(viewModel.snapshot.searchHighlight).toEqual({ kind: 'scene', id: 'scene-storm' });

    viewModel.setSearch('潮汐表背后');
    const clue = viewModel.snapshot.searchResults?.clues[0];
    if (clue) viewModel.openSearchResult(clue);
    expect(viewModel.snapshot.searchHighlight).toEqual({ kind: 'clue', id: 'clue-first-letter' });
    expect(viewModel.snapshot.story?.selectedSceneId).toBe('scene-storm');

    viewModel.clearSearch();
    expect(viewModel.snapshot.search).toBe('');
    expect(viewModel.snapshot.searchResults).toBeNull();
    expect(viewModel.snapshot.searchHighlight).toBeNull();
    expect(viewModel.timelineScenes.map((scene) => scene.id)).toEqual(orderBefore);
  });

  it('keeps search results fresh while the story changes and reports empty hits', () => {
    const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()), 0);
    viewModel.initialize();
    viewModel.setSearch('地下档案室');
    expect(viewModel.snapshot.searchResults?.total).toBe(0);
    viewModel.addScene('地下档案室', '他们找到被隐藏的航海日志。');
    expect(viewModel.snapshot.searchResults?.scenes.some((match) => match.field === '标题')).toBe(true);
    viewModel.clearSearch();
    expect(viewModel.snapshot.searchResults).toBeNull();
  });

  it('debounces search computation so typing stays responsive', () => {
    vi.useFakeTimers();
    try {
      const viewModel = new StoryViewModel(new LocalStoryRepository(new MemoryStorageService()), 200);
      viewModel.initialize();
      viewModel.setSearch('灯');
      expect(viewModel.snapshot.search).toBe('灯');
      expect(viewModel.snapshot.searchResults).toBeNull();
      viewModel.setSearch('灯塔');
      vi.advanceTimersByTime(199);
      expect(viewModel.snapshot.searchResults).toBeNull();
      vi.advanceTimersByTime(1);
      expect(viewModel.snapshot.searchResults?.query).toBe('灯塔');
      viewModel.setSearch('');
      expect(viewModel.snapshot.searchResults).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
