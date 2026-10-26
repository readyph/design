/**
 * Move focus to `target` only if the user's focus was actually lost, so a state change never pulls
 * focus away from where the user went meanwhile (e.g. another input they are typing in during a slow write).
 *
 * Focus counts as lost when the active element (read from the root `container` lives in, so it also
 * works inside a shadow root) is any of:
 *  - `null`, `body` or the document element (for a container in a shadow root: focus outside the root counts
 *    as the user's own, so it is left alone, unless it is on body) (the focused control was removed);
 *  - not connected to the document any more;
 *  - disabled (`:disabled`) or inside an `[inert]` subtree (Chrome keeps focus on such a control, but it is dead);
 *  - still inside `container` (e.g. the card's own button that was pressed).
 * No timeout: call it in a layout effect right after the state change. Returns whether focus moved;
 * when it returns `false`, announce the change in a live region instead.
 *
 * `options` is passed to `target.focus()` (e.g. `{ preventScroll: true }`).
 *
 * Use for "the control I pressed is gone, where does focus go" (done states, removed rows, closed panels).
 */
export function focusIfLost(container: Element | null, target: HTMLElement | null, options?: FocusOptions): boolean {
  if (!target) return false;
  const root = (container?.getRootNode() ?? target.getRootNode()) as Document | ShadowRoot;
  const doc = target.ownerDocument;
  // A ShadowRoot's activeElement is null whenever focus is outside that root (light DOM, another shadow
  // root): then the document's activeElement (the outside element or its host) says where focus really is.
  const active = () => root.activeElement ?? doc.activeElement;
  const a = active();
  const dead =
    !a ||
    a === doc.body ||
    a === doc.documentElement ||
    !a.isConnected ||
    a.matches(':disabled') ||
    a.closest('[inert]') !== null ||
    (container?.contains(a) ?? false);
  if (!dead) return false;
  target.focus(options);
  return active() === target;
}
