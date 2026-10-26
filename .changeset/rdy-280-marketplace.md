---
'@readyph/ui': minor
---

Marketplace modal (RDY-280, C20, new): `Marketplace` on `Modal size="marketplace"`, fixed 904 x 744 in every filter and state (full screen on a phone; only the tiles scroll, footer pinned). Props: `items` (`MarketplaceItem`: key, name, category, icon, description, shares, reads, owned, comingSoon, hasApp), `categories` (default All / Operations / Sales / Finance / Marketing), `status` (`ready | loading | error`, `onRetry`), `picked` / `defaultPicked` / `onPickedChange`, `category` / `defaultCategory` / `onCategoryChange`, `onInstall(item)`, `ledaNote` (plain slot until the Leda note C38 exists), `title`, `description`, `icon`, `className` (tile grid only). Tiles are a radio group (one tab stop, arrows and Home/End pick, Space/Enter pick, double click installs); Coming soon tiles are dashed and skipped; Install is disabled until a pick. Also exports `defaultMarketplaceCategories` and `marketplaceIoLine`.
