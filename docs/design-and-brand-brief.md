# Insurimple — Design & Brand Brief

**Source of truth:** `prototype/_ds/insurimple-design-system-*/` — seven token files +
`_ds_manifest.json` (20 components) + the 13 `.dc.html` screens.
**This doc describes those tokens; it does not override them.** If this doc and the token files
disagree, the token files win. Port tokens into Tailwind v4 `@theme` in
`packages/design-system` (CLAUDE.md §10) — do not retype values by hand.

---

## 1. Positioning

Insurimple is software for people who process insurance all day. It is not a consumer brand and
not a dashboard demo. The aesthetic target is **calm, dense, and fast** — closer to a
well-designed professional tool than to a marketing site.

Three adjectives: **quiet · exact · unhurried.**

The competitor is Applied Epic. Epic is dense but hostile: click-heavy, grey, title-only
search. We keep the density and remove the hostility.

## 2. Colour

Flat fills. **No gradients.** (Token file header states this explicitly.)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0C1B22` | primary text, headers |
| `--pine` | `#12796A` | primary action, links, active nav |
| `--pine-deep` | `#0D5F53` | pressed / emphasis |
| `--pine-tint` | `#E7F3F0` | selected rows, subtle fills |
| `--coral` | `#FF7A59` | attention, exceptions, overdue |
| `--coral-deep` | `#E45F3C` | destructive confirm |
| `--coral-tint` | `#FFE9E2` | warning surfaces |
| `--sand` | `#F7F4EF` | page background (warm, not white) |
| `--slate` | `#5B6B70` | secondary text |
| `--mist` | `#8A9599` | tertiary text, disabled |

Semantic text: `--text-1/2/3`, `--text-on-accent`, `--text-link`. Surfaces read from
`--surface-*`. **Never hardcode a hex in a component** — adherence lint fails the build.

**Coral is scarce.** It means *a human must look at this*: a download exception, an overdue
abeyance, a failed carrier submission. If coral is common on a screen, the screen is wrong.

## 3. Typography

One humanist sans, two weights. Serif reserved for editorial voice moments only.

- `--font-sans`: **Inter** (400 / 500 only)
- `--font-serif`: **Lora** — placeholder for the brand serif; editorial use only, never UI chrome
- Scale: hero 34 · h1 22 · h2 18 · body 16 · small 13 · caption 11
- Leading: 1.25 tight / 1.55 body · tracking: −0.01em tight, 0.06em caps

Two weights is a constraint, not an oversight. Hierarchy comes from size, colour and space.

## 4. Space, shape, motion

- Spacing scale: **4 / 8 / 12 / 16 / 24 / 32 / 48** — nothing off-scale
- Radius: control 8 · card 12 · pill 999
- Elevation: **at most two floating layers** — `--shadow-float` (popover, dropdown, toast) and
  `--shadow-overlay` (modal, drawer). Tiles are flat.
- Motion: `--duration-quick` 120ms / `--duration-base` 180ms, `--ease-quiet`. Motion confirms an
  action; it never entertains.

## 5. Components (the manifest — 20)

Display: `Avatar` `Badge` `Chip` `ListRow` `MetricCard` `Table` `EmptyState` `Spinner`
Form: `Button` `Checkbox` `Field` `IconButton` `Input` `Radio` `Select` `Switch`
Overlay: `Drawer` `Modal` `Tabs` `Toast`

Recreate as typed, copy-in (shadcn-style) components in `packages/design-system`. **Every screen
consumes this package only.** If a screen needs something absent here, add it to the package —
never inline it.

## 6. Density rules (how we beat Epic)

1. **Tables are the primary surface.** Rows are scannable at a glance; no card grids where a
   table belongs.
2. **Click budget.** Every routine action gets a target click count; exceeding it is a bug.
   Cancellation end-to-end is the benchmark flow.
3. **State is a `Badge`, always the same vocabulary** — the txn lifecycle words
   (`draft → doc_generated → sig_pending → signed → submitted → carrier_ack → completed`)
   appear identically everywhere.
4. **Keyboard first.** `⌘K` locate; queues navigable without a mouse.
5. **Empty states carry the next action**, not an illustration.
6. **Never hide the audit trail.** Who/when is visible on every record, not buried in a tab.

## 7. Tenant theming

Tenant branding reads CSS variables from the token layer. A tenant may override brand accent
and logo; it may not override semantic tokens (state colours, spacing, type scale). Vendor-blind
by construction — no tenant name in code paths.

## 8. Explicitly out of scope

`ui_kits/rate-family` and the other demo kits in the original bundle. Rate Family is a separate
product (CLAUDE.md §5). Never port it.
