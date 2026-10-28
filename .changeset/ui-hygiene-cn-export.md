---
'@readyph/ui': minor
---

`cn` and `focusRing` are exported from the package, so consumers use the same class-merge rules instead of a local `twMerge`. `cn` knows the layout keys: `cn('w-rail', 'w-full')` and `cn('h-status', 'h-8')` keep only the last width or height. Tests run under a package-level vitest config (jsdom and jest-dom).
