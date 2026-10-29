# AffordBase

Co-renting and rent-to-own for people the banks don't see: young professionals, low-income families, migrants and gig workers in Kazakhstan.

A one-room flat takes 70–76% of a median net salary in Astana and Almaty ([CMN.KZ, Aug 2026](https://cmn.kz/arenda-zhilya-v-kazahstane-diagnoz-i-chto-s-etim-delat-a08693/)), and more than 650,000 people are on the state housing waiting list ([Orda.kz, May 2025](https://en.orda.kz/over-650000-kazakhstanis-await-state-housing-distribution-process-to-be-centralized-6526/)). AffordBase matches compatible co-tenants, protects their lease, and turns part of every rent payment into square metres of a home they own.

**Stage:** working prototype. All calculations run in the browser for real; members, plots and regional data in the demos are illustrative. Pilot sign-ups and feedback are stored in Supabase.

The site is available in English, Russian and Kazakh: `?lang=en`, `?lang=ru`, `?lang=kk`, or the ҚАЗ/RU/EN switch in the header. Without a parameter it follows the browser language, falling back to English.

## Core path

1. **Match.** The co-living matcher scores compatibility by schedule, habits, budget and district, shows the saving, and generates a co-lease with eviction and rent-hike protection.
2. **Rent safely.** Lease check highlights unfair clauses and the money at stake; a SHA-256 condition report records the flat's state; a mutual-aid fund covers up to 3 months' rent.
3. **Own, metre by metre.** Rent-to-own: each payment buys square metres of a co-op flat, and rent is charged only on the metres not yet owned.

## Supporting modules

| Module | What works in the prototype |
| --- | --- |
| Reliability index | A 200–900 score from utility payments, transfer history, gig-income stability, housing burden, community activity and number of income sources, with tips to raise it. |
| Mutual-aid fund | 12-month cash-flow forecast under job loss, illness or late salary, with and without the fund; interest-free rent micro-loan for up to 3 months. |
| Lease check | Rule-based detection of 8 unfair clause types in Kazakh, Russian and English leases; photo OCR with Tesseract.js. |
| Building co-op | Plot map, pool shares, risk split and move-in queue (70% contribution, 30% activity); bulk materials ordering with supplier discounts. |
| Partners | Regional analytics and pool-funding calculator for social investors (3–5% a year); site listing for city administrations. |
| Utilities | Usage against household norms, saving tips, and a draft green-grant application for the co-op building. |

## Run locally

No build step. Serve the folder with any static server, for example:

```bash
npx serve .
# or
python3 -m http.server 8000
```

To publish on GitHub Pages: Settings → Pages → Deploy from branch → `main`, folder `/ (root)`.

## Structure

```
index.html       markup; English text inline, Russian in data-ru, Kazakh in data-kk
css/styles.css   styles and responsive layout
js/i18n.js       language selection and text swap
js/config.js     public Supabase URL and publishable key
js/data.js       demo data in three languages via L(en, ru, kk)
js/rules.js      lease-check rules, shared with the offline research tool
js/app.js        logic for every module, pilot sign-up and feedback
```

## Data

The site stores no personal data: no names, contacts or lease text. Supabase project `affordbase` has three tables used by the site, all insert-only for anonymous visitors (RLS):

- `pilot_survey`: anonymous survey (city, role, current rent, share of income on housing, main problem).
- `feedback`: 1–5 ratings and comments left under each module.
- `lease_checks`: anonymous lease-check stats (language, word count, which of the 8 risk types were found, money at risk). The lease text itself is never stored; the built-in sample is not counted.

The public RPCs `survey_count()` and `lease_check_count()` return only totals for the counters on the page. The older `signups` table is no longer used by the site.

Personal data of Kazakhstan citizens must be stored in Kazakhstan (Art. 12 of Law No. 94-V "On Personal Data and Their Protection"); move to in-country hosting before collecting accounts or contacts. See `privacy.html` and `terms.html`, and fill in the contacts in `js/config.js` before publishing. Read the data in the Supabase dashboard.

## Roadmap

- Interviews with renters and landlords in Astana
- Accounts and real pool data on a backend
- LLM-based lease review instead of fixed rules
- Shares and the mutual-aid fund tracked in smart contracts
- Smart-meter and payment integrations

The lease check is automated guidance, not legal advice.
