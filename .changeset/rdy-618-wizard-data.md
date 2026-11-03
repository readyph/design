---
'@readyph/ui': minor
---

RDY-618: the New service wizard takes its data from a host. Add `WizardDataProvider` / `WizardData` (customers, catalogue, Inventory products with stock, assignees, shop details, `onSaveCustomer`) and `useWizardData`; `useServiceFlow` accepts `data`, `nextJobNo`, `nextQuoteNo`. CustomerField, ServiceLines, PartPicker, schedule fields and the quotation document read it. Storybook keeps the sample data as the default. Exports the Job, Customer, ServiceType and WizardDraft types and the draft-to-job helpers.
