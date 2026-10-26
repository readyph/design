import { useSyncExternalStore } from 'react';

/** Live `matchMedia` match. False on the server and where `matchMedia` is missing. Falls back to `addListener` on older engines. */
export function useMatchMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      if (mq.addEventListener) {
        mq.addEventListener('change', cb);
        return () => mq.removeEventListener('change', cb);
      }
      mq.addListener?.(cb);
      return () => mq.removeListener?.(cb);
    },
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches,
    () => false,
  );
}
