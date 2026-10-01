// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function typeSearch(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function findGroup(container: HTMLElement, title: string): Element | undefined {
  return [...container.querySelectorAll('.search-group')].find((group) =>
    group.querySelector('.search-group-title')?.textContent?.includes(title),
  );
}

describe('search UI', () => {
  it('groups hits, marks the keyword, jumps to targets and restores the view', () => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();
    window.localStorage.clear();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(<App />);
    });

    const input = container.querySelector<HTMLInputElement>('input[aria-label="搜索故事结构"]');
    expect(input).not.toBeNull();
    if (!input) return;
    const sceneNodes = () => container.querySelectorAll('.scene-node');
    const selectedTitle = () => container.querySelector('.scene-node.selected .scene-copy strong')?.textContent;

    expect(sceneNodes()).toHaveLength(2);
    expect(selectedTitle()).toBe('旧港口的来信');

    // 输入伏笔里的字：场景摘要与伏笔都命中，时间线顺序和选中场景保持不变
    typeSearch(input, '潮汐表');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(findGroup(container, '场景')).toBeDefined();
    expect(findGroup(container, '伏笔')).toBeDefined();
    expect([...container.querySelectorAll('.search-results mark')].some((mark) => mark.textContent === '潮汐表')).toBe(true);
    expect(sceneNodes()).toHaveLength(2);
    expect(selectedTitle()).toBe('旧港口的来信');

    // 点击伏笔结果：对应伏笔行被标记出来
    const clueResult = findGroup(container, '伏笔')?.querySelector<HTMLButtonElement>('.search-result');
    act(() => {
      clueResult?.click();
    });
    expect(container.querySelector('.clue-row.search-hit strong')?.textContent).toBe('潮汐表背后的日期');

    // 输入冲突里的字：命中冲突分组，点击后切到对应场景并标记
    typeSearch(input, '各执一词');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const conflictResult = findGroup(container, '冲突')?.querySelector<HTMLButtonElement>('.search-result');
    expect(conflictResult).toBeDefined();
    act(() => {
      conflictResult?.click();
    });
    expect(container.querySelector('.scene-node.search-hit .scene-copy strong')?.textContent).toBe('风暴前夜');
    expect(selectedTitle()).toBe('风暴前夜');

    // 没有命中：给出看得懂的空结果，面板本身不空白
    typeSearch(input, '不存在的词');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelector('.search-empty')?.textContent).toContain('没有找到');
    expect(sceneNodes()).toHaveLength(2);

    // 清空搜索：结果面板与高亮消失，时间线和人物列表恢复原样
    const clearButton = container.querySelector<HTMLButtonElement>('.search-clear');
    act(() => {
      clearButton?.click();
    });
    expect(input.value).toBe('');
    expect(container.querySelector('.search-results')).toBeNull();
    expect(container.querySelector('.search-hit')).toBeNull();
    expect(sceneNodes()).toHaveLength(2);
    expect(container.querySelectorAll('.character-card')).toHaveLength(2);

    act(() => {
      root.unmount();
    });
    vi.useRealTimers();
  });
});
