# Design System — نظام المبيعات والمخزون

> The application design system, extending the visual identity established in `PRD-نظام-المبيعات-والمخزون-v3.1.html`.
> Authoritative for all UI work. If a screen needs something this file doesn't define, extend this file first, then build.

## 1. Identity & Principles

**The feel:** a calm, trustworthy counter tool — warm paper, jade ink, copper accents, receipt-paper motifs. It should feel like well-organized shop paperwork that happens to be digital, not like a SaaS dashboard.

1. **Arabic-first, RTL always.** The UI is written and laid out in Arabic. LTR appears only inside isolated data fragments (numbers, codes, barcodes).
2. **Speed over spectacle.** The POS screen is used hundreds of times a day; a full sale must take under 60 seconds. Every interaction optimizes for the next tap, not for delight.
3. **Money and stock are monospaced.** Every quantity, price, balance, and document number renders in the mono face with tabular digits — columns of numbers always align.
4. **State reads at a glance.** Stock levels, shift status, and debt states are encoded in shape + color (badges, pills, stripes), never color alone.
5. **The document is the brand.** Invoices, receipts, quotes, and statements share one identity: the ticket motif, the QR, the jade total.

## 2. Color

Tokens are CSS custom properties on `:root`; dark values are redefined under `@media (prefers-color-scheme: dark)` and again under `[data-theme="dark"]` / `[data-theme="light"]` so the in-app toggle always wins. Components use tokens only — never raw hex.

### Core palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#F3F4EF` | `#15110D` | App background (olive-tinted paper / coffee-black) |
| `--surface` | `#FFFFFF` | `#1E1911` | Cards, panels, tables, documents |
| `--surface-2` | `#EAEBE3` | `#241E15` | Nested fills: table headers, KPI tiles, input wells |
| `--text` | `#181A15` | `#F2EFE6` | Primary text |
| `--text-muted` | `#5B5F53` | `#A79E8A` | Secondary text, labels, captions |
| `--border` | `#DBDCD1` | `#332B1F` | Hairlines, card borders, dividers |
| `--jade` | `#0E8F68` | `#2BC792` | Primary: confirm, money-in, success, active nav |
| `--jade-2` | `#0B6E51` | `#3FE0AA` | Jade hover/pressed; gradient partner |
| `--copper` | `#B5711E` | `#E0A44C` | Secondary accent: warnings, low stock, credit/debt, eyebrows |
| `--copper-2` | `#8F5A16` | `#F0BE73` | Copper hover/pressed |
| `--alert` | `#C1421A` | `#FF7A4D` | Destructive, stock-out, cash shortage, overdue |

### Semantic mapping (do not invent new colors)

- **Success / money-in / in-stock** → jade
- **Warning / low stock / pending / credit balance** → copper
- **Danger / stock-out / delete / shortage / overdue** → alert
- **Neutral info** → `--text-muted` on `--surface-2`
- Cash **variance**: surplus = copper (investigate), shortage = alert, balanced = jade.

### Usage rules

- Jade is the only color for primary buttons. One primary action per screen region.
- Copper never sits on jade or vice versa; they meet only across a neutral.
- Tinted fills derive from tokens via `color-mix(in srgb, var(--jade) 12%, transparent)` — no hand-picked pastels.
- White text on jade/alert buttons; `--text` on copper fills in dark theme (copper lightens there).
- Both themes ship every component. Dark is not an inversion: shadows deepen (`rgba(0,0,0,.55)`), accents brighten (values above), and paper motifs keep their warm hue.

## 3. Typography

All fonts are **bundled locally as woff2** (`/public/fonts/`) via `@font-face` — the offline rule forbids CDN fonts.

| Role | Face | Weights | Usage |
|---|---|---|---|
| Display | **Cairo** | 600–900 | Screen titles, card headings, totals labels, buttons that confirm money |
| Body | **Tajawal** | 300, 400, 500, 700 | Everything readable: body, forms, table cells, nav |
| Data | **JetBrains Mono** | 400, 500, 700 | Numbers, prices, quantities, barcodes, invoice/QR refs, dates in tables |

### Type scale (rem, base 16px)

| Token | Size | Face/weight | Use |
|---|---|---|---|
| `display` | 1.75–2.25 (clamp) | Cairo 800 | Screen title (one per screen) |
| `h2` | 1.25 | Cairo 800 | Section/card group |
| `h3` | 1 | Cairo 700 | Card title |
| `body` | 0.9375 (15px) | Tajawal 400 | Default |
| `label` | 0.8125 | Tajawal 500 | Form labels, table headers |
| `caption` | 0.75 | Tajawal 400 muted | Help text, timestamps |
| `eyebrow` | 0.75 | Mono 500, `letter-spacing:.08em`, copper | Section markers, doc metadata |
| `money-lg` | 1.5 | Mono 700 jade | Cart total, KPI values |
| `money` | 0.875 | Mono 500 | Prices in lists/tables |

### Rules

- Arabic body text: `line-height: 1.7`. Headings: `1.35` with `text-wrap: balance`.
- **Numerals are Western digits (0–9)**, never Arabic-Indic (٠١٢) — matches the PRD documents and scanner output.
- Every numeric fragment: `font-family` mono, `direction: ltr`, `unicode-bidi: isolate`, `font-variant-numeric: tabular-nums`. Provide a single utility class (`.mono`) and use it everywhere digits appear.
- **Currency format:** `1,067.750 د.ل` — thousands separator, always exactly 3 decimals, currency suffix outside the LTR isolate. Formatting lives in one shared function; no ad-hoc `toFixed`.
- Running text max width: `65ch`.

## 4. Space, Shape, Elevation

- **Spacing scale:** 4px base — `4, 8, 12, 16, 20, 24, 32, 40, 56`. Siblings are spaced with flex/grid `gap`, not margins.
- **Radius:** `--radius: 14px` cards/modals · `10px` buttons/inputs · `999px` pills/chips · `4px` documents (paper is square-ish).
- **Borders:** 1px `--border` on every surface sitting on `--bg`. Dashed borders are reserved for document dividers and "automatic step" indicators.
- **Shadow:** one level only — `--shadow: 0 10px 30px -12px rgba(20,20,10,.18)` (dark: `0 14px 34px -12px rgba(0,0,0,.55)`). Used by modals, popovers, the invoice preview, and primary-button hover. Tables and cards rely on borders, not shadows.
- **Ticket motif:** documents and document-like cards (invoice preview, quote, receipt) get the perforated zig-zag edge (as in the PRD hero) — reserved for documents only, so the motif keeps meaning.

## 5. Layout & Navigation

- **Desktop (≥900px):** fixed sidebar 272px on the right (RTL start), content max `980px` for forms/reports; POS screen uses full width. Topbar only on mobile.
- **Tablet/mobile (<900px):** fixed topbar (58px, blurred surface) + drawer nav; safe-area insets respected; POS cart becomes a bottom sheet with a persistent total bar.
- **Grid patterns:** KPI rows `repeat(auto-fit, minmax(140px, 1fr))`; product grid on POS `minmax(150px, 1fr)`; forms are single-column.
- **POS screen anatomy** (the most-used screen): search/scan field permanently focused (scanner-first) at top; product grid center; cart panel on the left (RTL end) with total, payment pills (نقدي/بطاقة/آجل), and one jade confirm button. Nothing on this screen requires scrolling to complete a cash sale.
- Wide tables live inside `overflow-x: auto` wrappers with sticky first column on mobile; the page body never scrolls horizontally.

## 6. Components

**Buttons** — min-height 44px (POS quick-actions 56px). Primary: jade fill, white Cairo 700 text. Secondary: `--surface` + border. Destructive: alert fill, used only in confirm dialogs. Disabled: 45% opacity, no hover motion. Hover: `translateY(-1px)` + shadow; pressed: none.

**Inputs** — `--surface` field on `--surface-2` well? No: fields are `--surface` with `--border`, focus ring `2px var(--jade)` offset 2px. Labels above, Tajawal 500. Errors: alert border + explanatory text below ("what went wrong + how to fix"), never color alone. Numeric inputs get `.mono` and LTR isolation.

**Chips / filter pills** — pill radius, `--surface` + border; active = jade fill white text; counts inside chips in mono 11px.

**Status badges** (stock, debt, shift, document status) — pill, 10.5px mono, 1px colored border + colored text on transparent: jade = متوفر/مفتوحة/مدفوعة، copper = منخفض/آجل/مسودة، alert = نافذ/متأخرة/ملغاة. Filled variants only in tables' first-glance column.

**KPI tiles** — `--surface-2` fill, mono value 18px jade (alert if bad), 11.5px muted label. Never more than 4 in a row.

**Tables** — header row `--surface-2` Cairo 700 13px; rows divided by `--border`; numeric columns left-aligned (LTR numbers in RTL table), `.mono`; row hover `--surface-2`; first column is the entity name in `--text`, rest muted.

**Modals & sheets** — `--surface`, radius 14, shadow, backdrop `rgba(0,0,0,.4)`; mobile: bottom sheet. One primary action, ESC/backdrop closes (except mid-payment).

**Toasts** — jade fill (alert for failures), bottom center, Cairo 700 13.5px, auto-dismiss 3s. Copy states the outcome: "تم حفظ الفاتورة #INV-2026-00231".

**Stepper (quantity)** — 40×40px buttons, mono quantity between, long-press to repeat.

**PIN pad** — 3×4 grid of 64px keys, mono digits, appears as a modal for user switch / manager override; override reason shown on the same dialog.

**Empty states** — one muted sentence + one action button. No illustrations in V1.

## 7. Interaction Rules

- Touch targets ≥44×44px everywhere; ≥56px on POS confirm/payment controls.
- The barcode field regains focus after every scan/action on POS (USB scanners type + Enter).
- Destructive and money-affecting actions confirm with the amount restated in the dialog ("إلغاء فاتورة بقيمة 135.750 د.ل؟").
- Manager-override moments (discount above cap, stock override) use the PIN pad inline — never navigate away mid-sale.
- Keyboard: full tab order, visible focus ring, Enter confirms the sale from the cart, shortcuts listed in Settings.
- Idle lock returns to the PIN screen; the in-progress cart survives the lock.

## 8. Motion

- Durations: 150ms (hover/press), 250ms (drawer, sheet, toast), 350ms (theme cross-fade). Easing `ease` / `ease-out`.
- Motion communicates state change only: a confirmed sale flashes the total jade→neutral; a stock badge that flips to "منخفض" pulses once. No scroll-triggered reveals, no ambient animation — this is an operated tool.
- `prefers-reduced-motion: reduce` disables all transitions and animations globally.

## 9. Documents (print)

Shared identity: business logo/name (from Settings) top-start, mono document number + date top-end, dashed hairline dividers, item rows with mono amounts, jade grand total, QR bottom-start, payment-type pill bottom-end.

- **A4 invoice / quotation / statement:** `@page { size: A4; margin: 15mm }`, black-on-white only (no theme tokens in print CSS), Cairo headings ≥11pt, body 10pt, mono amounts 10pt, RTL alignment verified on physical printers (PRD acceptance). Status watermark (ملغاة / مسودة) diagonal at 8% opacity when applicable.
- **80mm thermal receipt:** width 72mm printable, single column, Tajawal 9pt / mono 9pt, no grays or images except logo in pure black, dashed separators, QR ≥20mm, generous top/bottom feed. Kiosk-print mode: no dialog.

## 10. Charts (Phase 3)

- Categorical series order: jade → copper → muted olive `#8B907C` → jade-2. Never more than 4 series; beyond that, aggregate.
- Money axes in mono with 3-decimal tooltips; comparison periods render the older period at 40% opacity of the same hue.
- Area fills at 12% opacity of the line color; faint `--border` gridlines; emphasized latest point.
- Semantic exceptions: shortage/negative bars always alert; low-stock always copper.
- RTL: time axes run right→left (newest at the left edge mirrors LTR convention — keep newest at the *left*, labeled clearly).

## 11. Accessibility

- Contrast ≥4.5:1 for text in both themes (the token pairs above pass; verify any new pair).
- State = shape + text + color, never color alone (badges carry words).
- Focus visible (`2px` jade outline) on every interactive element.
- `lang="ar" dir="rtl"` on the root; LTR fragments isolated with `unicode-bidi: isolate` so punctuation never scrambles.
- Form errors are text, associated via `aria-describedby`.

## 12. Implementation Notes

- Tokens live in one file (`tokens.css` or the Tailwind theme) — the tables above are the source; Tailwind maps them (`bg-surface`, `text-jade`, …). No component may hardcode a hex.
- Theme mechanism: tokens on `:root` → `@media (prefers-color-scheme: dark)` override → `[data-theme]` override (toggle wins both directions); choice persisted per device in localStorage.
- Fonts: woff2 subsets (Arabic + Latin for Cairo/Tajawal; Latin for JetBrains Mono) committed to the repo. Verify no network font requests in devtools — a silent fallback to system Arabic fonts is a bug.
- Print CSS is its own stylesheet, black-and-white, independent of theme tokens.
- The PRD HTML file doubles as a living reference for the identity (invoice mockup, chips, tickets, KPI tiles) — when in doubt, match it.
