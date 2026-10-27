---
'@readyph/ui': minor
---

RDY-361 stage 5 (Platform detail exact copy). `OpeningHours` now matches the workshop editor: the upcoming public holidays are native checkboxes in a `16px / 96px / name / state` row ("Sun 1 Nov", Closed or Open) instead of switches, the hint reads "Untick a holiday below to open that day anyway.", section titles are 13/20 and hints 12/16, sections sit 32px apart and the editor is at most 720px wide. New optional prop `companyLabel` replaces the generated company-hours sentence in the "Company hours: ..." hint. Existing consumers keep working; tests that looked for holiday `switch` roles should look for `checkbox`.
