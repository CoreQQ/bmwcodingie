# Installed skills

Vendored from https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT),
version 2.13.0. These are design-guidance skills Claude Code picks up
automatically when working on this repository's UI.

| Skill | What it is for |
|---|---|
| `ui-ux-pro-max` | The main one: styles, palettes, font pairings, UX guidelines, chart types, accessibility checks |
| `design` | General visual design decisions |
| `design-system` | Tokens, spacing, component consistency |
| `brand` | Brand identity and voice |
| `banner-design` | Social/ad banners |
| `slides` | Presentation decks |

`ui-styling` from the upstream repo was **not** installed: it is built around
shadcn/ui (this site uses plain Tailwind) and ships ~6 MB of TTF fonts we do
not need — the site's fonts come from `next/font`.

To update: re-clone upstream and copy `.claude/skills/*` over these folders.
