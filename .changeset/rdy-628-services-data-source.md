---
"@readyph/ui": minor
---

RDY-628: the Services list (ServicesTable, ServiceCard, ServicesToolbar, BulkBar, servicesModel) is data-agnostic. Wrap it in `ServicesDataProvider` with the host's customers, products, mechanics and clock; the toolbar and bulk bar also take a `mechanics` prop. Without a provider it uses the sample data, so stories are unchanged.
