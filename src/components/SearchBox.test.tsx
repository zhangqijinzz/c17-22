import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Highlight } from './Highlight';
import { SearchBox } from './SearchBox';
import { createStarterStory } from '../models/story';
import { searchStory } from '../models/storySearch';

describe('Highlight', () => {
  it('marks every matched character', () => {
    const html = renderToStaticMarkup(createElement(Highlight, { text: '她必须决定是否相信', keyword: '决定' }));
    expect(html).toContain('<mark class="search-mark">决定</mark>');
  });

  it('renders plain text when keyword is blank', () => {
    const html = renderToStaticMarkup(createElement(Highlight, { text: '普通文本', keyword: '  ' }));
    expect(html).toBe('普通文本');
  });
});

describe('SearchBox', () => {
  const story = createStarterStory();

  it('renders results grouped by category with counts', () => {
    const html = renderToStaticMarkup(createElement(SearchBox, {
      query: '的',
      results: searchStory(story, '的'),
      onCommit: () => undefined,
      onPick: () => undefined,
    }));
    expect(html).toContain('人物');
    expect(html).toContain('场景');
    expect(html).toContain('冲突');
    expect(html).toContain('search-mark');
  });

  it('renders an understandable empty state instead of a blank panel', () => {
    const html = renderToStaticMarkup(createElement(SearchBox, {
      query: '不存在的关键词xyz',
      results: [],
      onCommit: () => undefined,
      onPick: () => undefined,
    }));
    expect(html).toContain('没有找到与');
    expect(html).toContain('不存在的关键词xyz');
  });
});
