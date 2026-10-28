---
'@readyph/ui': minor
---

List, ListGroups, Queue: with several lists on one page, only the list that last received focus or a pointer press handles j / k (and `s` in Queue); the first list mounted owns them until then. `shortcuts={false}` still opts a list out, and keys stay ignored in inputs, menus and dialogs. ListCell is as tall as a button and centres its content, so one-line rows sit level with their action buttons; multi-line cells keep their text at the top, and stacked rows are unchanged.
