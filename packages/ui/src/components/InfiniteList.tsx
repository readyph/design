import { useEffect, useRef, type RefObject } from 'react';
import { Skeleton } from './Skeleton';

/** The nearest ancestor that scrolls vertically (the list's own scroll container, on desktop and on a phone). */
export function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === 'auto' || oy === 'scroll') return p;
  }
  return null;
}

export interface InfiniteSentinelProps {
  /** More rows exist than are loaded. */
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** Start loading this far before the bottom. */
  margin?: number;
}

/**
 * Studio-only InfiniteSentinel (NEW): a 1px marker placed after the last row, inside the scroll container. When it comes within `margin` of the visible
 * area, `onLoadMore` fires once; the observer is rebuilt after every batch, so a tall screen that is still not full asks again. Without IntersectionObserver
 * (old browsers, tests) it renders a "Load more" button instead, so the list is never stuck.
 */
export function InfiniteSentinel({ hasMore, loading, onLoadMore, margin = 240 }: InfiniteSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onLoadMore);
  cb.current = onLoadMore;
  const supported = typeof IntersectionObserver !== 'undefined';
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || loading || !supported) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) cb.current(); }, { root: scrollParent(el), rootMargin: `0px 0px ${margin}px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, margin, supported]);
  if (!hasMore) return null;
  return <div ref={ref} aria-hidden={supported} data-sentinel className="flex min-h-px justify-center">{!supported && !loading && <button type="button" onClick={onLoadMore} className="min-h-11 px-3 text-[13px] font-semibold text-accent underline">Load more</button>}</div>;
}

/** Studio-only ListEnd (NEW): the last thing in the list, so the end is a place and not a guess. */
export function ListEnd({ total, noun = 'services' }: { total: number; noun?: string }) {
  return <p data-end className="px-4 py-4 text-center text-[13px] tabular-nums text-muted">End of list · {total} {noun}</p>;
}

/** Phone placeholder cards, same rhythm as ServiceCard. */
export function CardSkeletons({ n = 3 }: { n?: number }) {
  return <div data-loading-more role="status" aria-label="Loading more services" className="space-y-4 py-3">{Array.from({ length: n }, (_, i) => <Skeleton key={i} variant="text" lines={3} />)}</div>;
}

/** The list's own counter, pinned under the scroll area (it replaces the pager). */
export function ResultCount({ shown, total, loadingMore, noun = 'services' }: { shown: number; total: number; loadingMore?: boolean; noun?: string }) {
  return (
    <p className="flex-none border-t border-rule bg-surface px-4 py-2 text-[13px] text-muted min-[641px]:px-6" aria-live="polite">
      Showing <span className="tabular-nums text-text">{shown}</span> of <span className="tabular-nums">{total}</span> {noun}{loadingMore ? ' · loading more' : shown < total ? ' · scroll for more' : ''}
    </p>
  );
}

/** Convenience for pages: scroll a container (found from a ref inside it) back to the top. */
export function scrollTop(ref: RefObject<HTMLElement | null>) { const el = ref.current; (el && getComputedStyle(el).overflowY !== 'visible' ? el : scrollParent(el))?.scrollTo({ top: 0 }); }
