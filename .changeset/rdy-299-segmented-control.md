---
'@readyph/ui': minor
---

Segmented control (C39): rebuilt on the new tokens (raised-2 track, 28px segments, 13px text, surface + border selected state), optional `count` and `disabled` per option, and a `disabled` prop. API changes for consumers: the group is now `role="group"` with `aria-pressed` buttons instead of a `tablist` (use `semantics="radio"` for a radiogroup with roving tabindex and arrow keys, or `semantics="menu"` for `menuitemradio` inside the account menu); `onChange` fires only when the value actually changes; `icon` takes a component (as before) and is 16px.
