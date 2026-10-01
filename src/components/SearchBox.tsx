import { useEffect, useMemo, useRef, useState } from 'react';
import {
  groupSearchResults,
  searchCategoryLabels,
  type StorySearchResult,
} from '../models/storySearch';
import { Highlight } from './Highlight';

interface SearchBoxProps {
  query: string;
  results: StorySearchResult[];
  onCommit: (value: string) => void;
  onPick: (result: StorySearchResult) => void;
}

const categoryIcons: Record<StorySearchResult['category'], string> = {
  character: '♧',
  scene: '◈',
  conflict: '⚡',
  clue: '⌁',
};

export function SearchBox({ query, results, onCommit, onPick }: SearchBoxProps) {
  const [draft, setDraft] = useState(query);
  const [open, setOpen] = useState(() => query.trim().length > 0);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const keyword = query.trim();
  const groups = useMemo(() => groupSearchResults(results), [results]);

  // 外部清空（例如点了清除按钮）时同步输入框
  useEffect(() => {
    if (query === '') setDraft('');
  }, [query]);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, []);

  const handleChange = (value: string) => {
    setDraft(value);
    setOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onCommit(value), 150);
  };

  const clear = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setDraft('');
    onCommit('');
    setOpen(false);
  };

  const pick = (result: StorySearchResult) => {
    onPick(result);
    setOpen(false);
  };

  return (
    <div className="search-box-wrap" ref={boxRef}>
      <label className="search-box">
        <span>⌕</span>
        <input
          aria-label="搜索故事结构"
          aria-expanded={open && keyword.length > 0}
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
          placeholder="搜索人物、场景、冲突、伏笔…"
        />
        {draft && <button type="button" className="search-clear" aria-label="清空搜索" onClick={clear}>×</button>}
      </label>
      {open && keyword.length > 0 && (
        <div className="search-menu" role="listbox" aria-label="搜索结果">
          {results.length > 0 ? (
            <>
              {groups.map((group) => (
                <div className="search-group" key={group.category}>
                  <div className="search-group-title">
                    <span className={`search-group-icon ${group.category}`}>{categoryIcons[group.category]}</span>
                    {searchCategoryLabels[group.category]}
                    <em>{group.items.length}</em>
                  </div>
                  {group.items.map((result, index) => (
                    <button
                      type="button"
                      className="search-result"
                      role="option"
                      key={`${result.category}-${result.ownerId}-${index}`}
                      onClick={() => pick(result)}
                    >
                      <span className="search-result-main">
                        <strong><Highlight text={result.title} keyword={keyword} /></strong>
                        <i className="search-field-tag">{result.fieldLabel}</i>
                        {typeof result.sceneOrder === 'number' && <i className="search-scene-order">SCENE {String(result.sceneOrder).padStart(2, '0')}</i>}
                      </span>
                      <span className="search-result-snippet"><Highlight text={result.snippet} keyword={keyword} /></span>
                    </button>
                  ))}
                </div>
              ))}
              <div className="search-menu-footer">共 {results.length} 条命中 · 点击跳转到对应位置</div>
            </>
          ) : (
            <div className="search-empty">
              <strong>没有找到与「{keyword}」相关的内容</strong>
              <span>试试人物姓名、场景标题、冲突或伏笔里的其它关键词</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
