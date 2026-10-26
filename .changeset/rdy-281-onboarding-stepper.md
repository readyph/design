---
'@readyph/ui': minor
---

Onboarding stepper (C21, new): `OnboardingStepper` is a controlled layout and state component for guided setup. Left (wide) or chips (narrow, under 720px of its own width): the step list as an `<ol>` (done, current, skipped dashed, locked with a reason) plus the C40 progress bar; right: the section heading, an optional `intro` slot (e.g. `LedaNote`), your form as `children`, and a sticky footer (Back, Finish later, Skip for now, primary). API: `steps[] {id, label, status?, locked?, reason?, required?}`, `current`, `onStepChange(id)`, `continueLabel`, `continueLoading`, `continueDisabled`, `busy`, `onContinue`, `onSkip`, `onBack`, `onFinishLater`, `progressLabel`. It never reads the URL: map `?id=…&setup=N` to `current` yourself. Focus moves to the section heading on step change; locked steps are `aria-disabled` with the reason as description; the live region speaks only progress changes and locked presses.
