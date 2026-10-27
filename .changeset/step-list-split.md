---
'@readyph/ui': minor
---

OnboardingStepper: new `StepList` (step list and progress bar, with a one-line `variant="header"` for phones) and `StepFooter` exports, and `list={false}` / `stepListRef` on `OnboardingStepper` so a page can put the list in the place column. Locked steps are now out of the Tab order (`tabIndex=-1`). The Platform onboarding prototype uses the split.
