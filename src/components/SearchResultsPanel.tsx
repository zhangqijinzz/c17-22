import type { ReactNode } from 'react';
import type { StorySearchMatch, StorySearchResults } from '../models/storyRules';
import type { StoryViewModel } from '../viewmodels/storyViewModel';

interface SearchResultsPanelProps {
  viewModel: StoryViewModel;
}

const GROUPS: Array<{ key: 'characters' | 'scenes' | 'conflicts' | 'clues'; title: string }> = [
  { key: 'characters', title: '人物' },
  { key: 'scenes', title: '场景' },
  { key: 'conflicts', title: '冲突' },
  { key: 'clues', title: '伏笔' },
];

function MarkedText({ text, query }: { text: string; query: string }) {
  const needle = query.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const found = text.toLowerCase().indexOf(needle, cursor);
    if (found === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (found > cursor) parts.push(text.slice(cursor, found));
    parts.push(<mark key={found}>{text.slice(found, found + needle.length)}</mark>);
    cursor = found + needle.length;
  }
  return <>{parts}</>;
}

function SearchResultItem({ match, query, onOpen }: { match: StorySearchMatch; query: string; onOpen: () => void }) {
  const labelIsMatch = match.label === match.text;
  return (
    <button className="search-result" onClick={onOpen}>
      <span className="search-result-head">
        <em>{match.field}</em>
        <strong>{labelIsMatch ? <MarkedText text={match.label} query={query} /> : match.label}</strong>
        {match.meta && <span className="search-result-meta">{match.meta}</span>}
      </span>
      {!labelIsMatch && (
        <span className="search-result-text">
          <MarkedText text={match.text} query={query} />
        </span>
      )}
    </button>
  );
}

function SearchEmptyState({ results }: { results: StorySearchResults }) {
  return (
    <div className="search-empty">
      <strong>没有找到「{results.query}」</strong>
      <span>人物、场景、冲突和伏笔里都没有命中。换个关键词试试，比如人物名、场景标题或伏笔里的字。</span>
    </div>
  );
}

export function SearchResultsPanel({ viewModel }: SearchResultsPanelProps) {
  const results = viewModel.snapshot.searchResults;
  if (!results) return null;
  return (
    <div className="search-results" role="dialog" aria-label="搜索结果">
      <div className="search-results-head">
        <span>{results.total > 0 ? `「${results.query}」命中 ${results.total} 处` : `「${results.query}」没有命中`}</span>
        <button aria-label="清空搜索" onClick={() => viewModel.clearSearch()}>✕</button>
      </div>
      {results.total === 0 ? (
        <SearchEmptyState results={results} />
      ) : (
        GROUPS.map((group) => {
          const matches = results[group.key];
          if (matches.length === 0) return null;
          return (
            <div className="search-group" key={group.key}>
              <div className="search-group-title">
                {group.title}
                <span>{matches.length}</span>
              </div>
              {matches.map((match) => (
                <SearchResultItem
                  key={`${match.category}-${match.id}-${match.field}`}
                  match={match}
                  query={results.query}
                  onOpen={() => viewModel.openSearchResult(match)}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
