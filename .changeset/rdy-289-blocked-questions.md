---
'@readyph/ui': minor
---

Blocked questions list (RDY-289, C29, new): `BlockedQuestions`. The reply Leda gives (company and one per platform, inline "Edit reply"), ruled rows built on `List` (question, tag "Every business" or the platform, Try, Remove with `ConfirmDialog` and `toast.undo`) and an add form (input + "Block question", Enter works, case/space-insensitive duplicates refused also against every-business; "Blocked for" `Select` unless `scope` is fixed). Props: `items[{id,question,scope}]`, `scopes[{id,label,icon?}]`, `everyScope`, `scope`, `replies`, `onBlock`, `onRemove(item,{undo})`, `onTry`, `onEditReply`, `readOnly`/`readOnlyNote`, `status`/`onRetry`, `maxLength`, `replyMaxLength`, `maxItems`, `intro`, `inheritedLink`, `shortcuts`. Focus moves only when it was lost (one internal `focusIfLost`, to be swapped for the shared helper); otherwise results are announced. Also exports `normalizeBlockedQuestion`.
