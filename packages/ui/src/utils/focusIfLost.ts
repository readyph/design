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
 *
 * Nested open shadow roots are walked: when the active element is a shadow host whose root holds the focus,
 * the innermost focused element is the one checked for disabled, and `[inert]` / `container` are matched
 * across shadow boundaries (an inert ancestor in an outer root counts).
 *
 * `container` may be `null` (the region is already unmounted): then only "focus is on nothing, a removed,
 * disabled or inert element" counts as lost, and the root is read from `target`. A `null` container can never
 * make a still-focused, live control count as lost, so focus is not pulled away from it.
 * No timeout: call it in a layout effect right after the state change. Returns whether focus moved;
 * when it returns `false`, announce the change in a live region instead.
 *
 * `options` is passed to `target.focus()` (e.g. `{ preventScroll: true }`).
 *
 * Use for "the control I pressed is gone, where does focus go" (done states, removed rows, closed panels).
 */
/** The innermost focused element, descending through open shadow roots. */
function deepest(el: Element | null): Element | null {
  let a = el;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

/** Parent in the flat tree: crosses a shadow root up to its host. */
function flatParent(el: Element): Element | null {
  if (el.parentElement) return el.parentElement;
  const r = el.getRootNode();
  return r instanceof ShadowRoot ? r.host : null;
}

function insideFlat(el: Element, test: (e: Element) => boolean): boolean {
  for (let e: Element | null = el; e; e = flatParent(e)) if (test(e)) return true;
  return false;
}

export function focusIfLost(container: Element | null, target: HTMLElement | null, options?: FocusOptions): boolean {
  if (!target) return false;
  const root = (container?.getRootNode() ?? target.getRootNode()) as Document | ShadowRoot;
  const doc = target.ownerDocument;
  // A ShadowRoot's activeElement is null whenever focus is outside that root (light DOM, another shadow
  // root): then the document's activeElement (the outside element or its host) says where focus really is.
  const active = () => deepest(root.activeElement ?? doc.activeElement);
  const a = active();
  const dead =
    !a ||
    a === doc.body ||
    a === doc.documentElement ||
    !a.isConnected ||
    a.matches(':disabled') ||
    insideFlat(a, (e) => e.hasAttribute('inert')) ||
    (container ? insideFlat(a, (e) => e === container) : false);
  if (!dead) return false;
  target.focus(options);
  return active() === target;
}
