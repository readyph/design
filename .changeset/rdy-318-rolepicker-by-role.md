---
'@readyph/ui': minor
---

RolePicker: new `mode="by-role"` for one platform's people (the platform Team tab). A row per person with the role dropdown and the chosen role's line under it; Admin and Owner as a tag; people who have not joined shown read only ("Mechanic when they join"); "Not assigned" asks first with the `removeConfirm` words and applies on Save. `value` is `Record<personId, roleId | null>`. A host with its own Save bar passes `hideActions` and `onRemovePerson` (an X per row), and `roleLines={false}` for a compact list. The default person-by-platform mode is unchanged; `RolePickerRemoveConfirm` is now generic (`<T = RolePickerPlatform>`). For Leonardo: RDY-258/Portal Team can drop its Team tab composition for this mode.
