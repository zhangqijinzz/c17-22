import type { ReactNode } from 'react';
import { normalizeKeyword } from '../models/storySearch';

interface HighlightProps {
  text: string;
  keyword: string;
}

/** 把命中的字直接标黄，让人一眼看到检索命中了哪几个字。 */
export function Highlight({ text, keyword }: HighlightProps) {
  const normalized = normalizeKeyword(keyword);
  if (normalized === '') return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lower.indexOf(normalized, cursor);
  while (matchIndex >= 0) {
    if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex));
    parts.push(<mark key={`${matchIndex}-${normalized}`} className="search-mark">{text.slice(matchIndex, matchIndex + normalized.length)}</mark>);
    cursor = matchIndex + normalized.length;
    matchIndex = lower.indexOf(normalized, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
