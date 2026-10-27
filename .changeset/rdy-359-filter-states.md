---
'@readyph/ui': patch
---

TownMap and Queue (RDY-359 review): with `fadeOthers`, the non-selected labels fade (opacity .55) while a platform is selected, and the selected label's sub line carries its status dot. The Queue filter chip stays on one line and keeps its width (the heading wraps instead).

`PlatformLogo` accepts `size={28}` (additive). `Queue`: the title no longer shrinks below its longest word, and on phone with tight groups and no pinned group the list has no bottom padding (workshop parity).

Home HQ filter at 641 and below: the team pane hides the item reference in the narrow layout (new optional `TodayItem.hideRefNarrow`), the Open Team and Open Plan buttons stay on one line, and Escape from Leda returns focus to the Ask bar when the opener was body.
