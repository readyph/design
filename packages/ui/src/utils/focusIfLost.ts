/**
 * Move focus to `target` only if the user's focus was actually lost: `document.activeElement` is
 * `null` or `body` (the focused control was removed) or still inside `container` (e.g. the card's
 * own button). If focus is somewhere else (another input the user moved to while a slow write ran),
 * it is left alone, so typing is never interrupted. No timeout: call it in a layout effect right
 * after the state change. Returns whether focus moved; when it returns `false`, announce the change
 * in a live region instead.
 *
 * Use for "the control I pressed is gone, where does focus go" (done states, removed rows, closed panels).
 */
export function focusIfLost(container: Element | null, target: HTMLElement | null): boolean {
  if (!target || typeof document === 'undefined') return false;
  const a = document.activeElement;
  const lost = !a || a === document.body || a === document.documentElement || (container?.contains(a) ?? false);
  if (!lost) return false;
  target.focus();
  return document.activeElement === target;
}
