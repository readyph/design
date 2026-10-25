---
'@readyph/ui': minor
---

Button and IconButton (RDY-293, C33): variants primary / secondary / text / danger (`subtle` renamed `text`), 32px tall (40 phone, 44 in phone action bars), 5px radius, 13px 500, 12px side padding, 14px icons, disabled at 70%. Danger is a filled `--bad` with the new `--bad-on` ink (white in light, #0b1020 in dark) so it passes AA on rest and hover; new token `--bad-on`. Secondary hover darkens the border to `--muted`; text hover uses `--raised`. IconButton requires a `label`. The `shortcut` prop is removed until Kbd is rebuilt (inventory `ProductsPage.tsx` uses it).
