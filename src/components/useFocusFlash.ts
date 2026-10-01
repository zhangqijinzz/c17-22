import { useCallback, useLayoutEffect, useRef } from 'react';
import type { SearchCategory } from '../models/storySearch';

export interface FocusRequest {
  category: SearchCategory;
  ownerId: string;
  /** 每次定位递增，保证点同一条结果也能再次滚动并闪烁 */
  nonce: number;
}

export function useFocusFlash(request: FocusRequest | null, category: SearchCategory, ownerId: string) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!request || request.category !== category || request.ownerId !== ownerId || !element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.remove('search-flash');
    // 强制重新触发动画
    void element.offsetWidth;
    element.classList.add('search-flash');
    const timer = window.setTimeout(() => element.classList.remove('search-flash'), 1800);
    return () => window.clearTimeout(timer);
  }, [request, category, ownerId]);

  return useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);
}
