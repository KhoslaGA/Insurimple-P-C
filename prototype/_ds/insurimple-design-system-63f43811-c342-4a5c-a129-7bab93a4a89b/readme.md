# Insurimple Design System

One design system serving three brands from a single token contract:

- **Insurimple** (SaaS Co) — the engine; insurance platform software sold to brokerages. Clean, calm, modern, deliberately vendor-neutral (it's sold to KLC's competitors). "Insurance, made simple."
- **Rate Family** (Webhub4u) — consumer comparison front door. Warm, playful, trustworthy. Four sub-brands from one system: TopRates.ca, LifeRate.ca, TermRates.ca, HealthRate.ca (shared bones, per-vertical accent). Mascot: **Bo the beaver** — lives here only, never in Insurimple. "Find your rate."
- **KLC Group** — licensed human advice layer. Steady, expert, personal. "Advice you can actually reach."

Positioning: **Simple insurance — for everyone it touches.** Values: Simple, Honest, Human, Canadian (newcomers, Super Visa, bilingual-ready, data in ca-central).

**Source:** `uploads/design-and-brand-brief.md` (July 2026, Gautam Khosla). No codebase, Figma, logos, fonts, or imagery were provided — everything here is built from that brief. See CAVEATS.

## Content fundamentals

Plain-spoken, warm, confident. A helpful friend who happens to be an expert. Never fear-sells, never condescends.

- **Sentence case everywhere** — headings, buttons, labels, nav. Never Title Case, never ALL CAPS (except tiny token-level captions/overlines).
- Contractions ("you're covered", "we'll call you"). Active voice, verb first ("Compare rates", "Add a contact", "Send the quote").
- Say what it does. Banned filler: "simply", "just", "easy", "seamless", "unlock".
- **Errors:** what happened, then what to do. No blame, no jargon. ✗ "Invalid input." ✓ "That postal code doesn't look right. Check the format — like M5V 2T6."
- **Newcomer-facing copy:** shorter sentences; define the one term that matters ("Term life = coverage for a set number of years"); never assume prior Canadian context.
- "You/your" for the user; "we" for the brand. First person plural, accountable ("We make money when…" — compliance is care, not cover).
- No emoji in product UI. Rate Family marketing may be warmer but stays word-driven; Bo carries the personality, not emoji.

## Visual foundations

- **Color:** Ink `#0C1B22`, Pine `#12796A` (primary), Pine tint `#E7F3F0`, Coral `#FF7A59` (accent/CTA), Sand `#F7F4EF` (warm page bg), Slate `#5B6B70`. **Flat fills, no gradients — ever.** Semantic: success/warning/danger/info in muted, warm-leaning tones. Per-vertical Rate Family accents: top=coral, life=pine, term=slate-blue `#33608C`, health=warm red `#C4544B`.
- **Type:** one humanist sans (Inter placeholder — brief allows Inter/Söhne/General Sans) at exactly two weights: 400 and 500. Scale 34/22/18/16/13/11. Generous line-height (1.55 body). Warm serif (Lora placeholder) reserved for editorial voice moments only — pull quotes, guide intros — never UI chrome.
- **Spacing:** 4/8/12/16/24/32/48. Generous whitespace is a brand behavior — clarity over density.
- **Backgrounds:** flat Sand for marketing pages, near-white `#FAF9F6` for app surfaces, white cards. No textures, patterns, or gradients. Dark mode via `[data-mode="dark"]` surface tokens.
- **Corners:** controls 8px, cards 12px, pills for chips/badges.
- **Cards:** white, 1px `--border-1` border, 12px radius, **no shadow at rest** (flat tiles). Elevation is reserved for at most two floating layers: `--shadow-float` (popovers, dropdowns, toasts) and `--shadow-overlay` (modals, drawers).
- **Borders:** hairline 1px, warm gray `#E4E0D7`. Focus = 2px Pine ring (`box-shadow: 0 0 0 2px`), visible always.
- **Motion:** quiet and functional. 120–180ms, `--ease-quiet` (standard ease), fades and small translates. Nothing bouncy, springy, or attention-seeking.
- **Hover:** darker fill for solid buttons (`--tenant-primary-deep`), tint fill for quiet controls. **Press:** slightly darker again; no shrink/scale.
- **Transparency/blur:** essentially none — flat surfaces. Scrims are solid ink at 40% opacity for modals only.
- **Imagery:** real, warm, Canadian, diverse — newcomers and families, not stock-suited executives. Never fear imagery (no storms, crashes, hospital dread). None provided yet; use neutral placeholders.
- **Theming (non-negotiable):** components never hardcode brand color — they read `--tenant-primary/-deep/-tint` and `--tenant-accent/-deep` from `tokens/themes.css`. Themes ship for Insurimple (default), KLC (`[data-theme="klc"]`), a mock brokerage (`[data-theme="northpeak"]`), and Rate Family verticals (`[data-vertical="top|life|term|health"]`).

## Iconography

- Single **outline** set, consistent stroke — brief specifies "Tabler-style". No source icons were provided, so the system links **Tabler Icons via CDN** (webfont, `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.1/dist/tabler-icons.min.css`, class `ti ti-<name>`) — a direct match, not an approximation.
- Usage: 20px in controls, 1.75 stroke feel, colored `currentColor`. Icons support the label; never icon-only without a tooltip/aria-label.
- Product-line icons (from Tabler): life `ti-heart`, health `ti-first-aid-kit`, travel `ti-plane`, auto `ti-car`, home `ti-home`, mortgage `ti-building-bank`, credit card `ti-credit-card`, Super Visa `ti-passport`.
- No icon font in codebase (no codebase given). No emoji as icons. No hand-drawn SVGs.

## Logos & mascot — NOT PROVIDED

No logo files were given. **Do not draw or approximate marks.** Wherever a logo would sit, render the brand name in plain type: lowercase `insurimple` (sans, 500, tight tracking), `Rate Family` warm, `KLC Group` restrained. Bo the beaver has no artwork yet — use a labeled placeholder slot, never a drawn beaver.

## Index

- `styles.css` — global entry; imports everything under `tokens/`.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `shape.css` (radius/elevation/motion), `themes.css` (white-label contract), `fonts.css`, `base.css`.
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/forms/` — Button, IconButton, Input, Select, Checkbox, Radio, Switch, Field.
- `components/data/` — Badge, Chip, Avatar, MetricCard, ListRow, Table.
- `components/overlay/` — Tabs, Modal, Drawer, Toast.
- `components/feedback/` — EmptyState, Spinner.
- `ui_kits/insurimple_app/` — the SaaS product: login, accept-invite + MFA, tenant sign-up wizard, auth states, app shell (command bar, notifications), 6 role-aware dashboards, CRM (contacts, party record, pipeline, lead inbox, create/edit party), BMS (policies, policy record, transactions, renewals triage, transaction stepper, new-transaction modal, document generation + e-signature), telephony (softphone states, screen pops, call log), growth (campaigns, segment builder), reports, settings (team, roles, licences, branding editor, integrations, billing), system states.
- `ui_kits/insurimple_site/` — marketing site: homepage, pricing, security & compliance, book a demo.
- `ui_kits/rate_family/` — LifeRate vertical landing + quoter step.
- `guidelines/theming.card.html` — white-label proof (same UI, three tenant themes).
- `SKILL.md` — agent skill entry point.

## Intentional additions

- `Field` (label + control + help/error wrapper) — needed to express the error-copy voice rules consistently.
- `Spinner`/`EmptyState` — brief §7E lists "empty / loading / error state patterns".

## CAVEATS

- **Fonts are placeholders**: Inter (named in brief) + Lora via Google Fonts `@import`; no binaries ship. Provide licensed files (Söhne/General Sans + brand serif) to replace `tokens/fonts.css` with real `@font-face`.
- **No logos, no Bo artwork, no photography** — plain-type wordmarks and labeled placeholders used throughout.
- Vertical accents for term/health and the KLC/NorthPeak theme palettes are proposed, not specified — tune in `tokens/themes.css`.
