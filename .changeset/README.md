# Changesets

This folder holds [Changesets](https://github.com/changesets/changesets) — one
Markdown file per unreleased change, describing the version bump and a summary for
the changelog.

Add one after making a change:

```bash
npx changeset
```

`@readyph/ui` is the single published package — a changeset bumps it and updates
its changelog.

The Release workflow consumes these on `main`: it opens a "Version Packages" PR
that applies the bumps and changelogs; merging it builds and publishes.
