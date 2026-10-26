---
'@readyph/ui': minor
---

RolePicker (C22, new): per-platform role picker. One ruled row per platform (logo, full name, kind, a `Select` with "Not assigned" and that kind's roles, the chosen role's line, locked rows with their reason tied by `aria-describedby`), then the company access radios (Owner shown but never chosen, Admin, Member; Radix radiogroup, one tab stop, arrow keys). Admin and Owner replace the rows with "Full access to every platform" and announce the swap. Controlled draft with one Save and Discard (disabled until dirty), busy and error states, a warning when no role is left, and a confirm on Save when a saved role is removed. Value `{access, roles: Record<platformId, roleId | null>}`, props `savedValue`, `onChange`, `onSave`, `onDiscard`, `platforms[] {id,name,kind,locked?,reason?}`, `roleOptions` by kind.
