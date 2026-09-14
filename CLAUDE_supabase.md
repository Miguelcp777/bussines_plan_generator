# JJV Business Plan Tool — Claude Code Instructions

## Overview
Static single-file web app talking directly to **Supabase** (Postgres + Auth) via `supabase-js`.
Served as a static `business_plan_tool.html` (nginx in prod). No Flask in the request path.
Dependencies loaded from CDN:
- **PapaParse 5.4.1** — CSV parsing
- **Chart.js 4.4.1** — charts
- **xlsx 0.18.5** — Excel export
- **@supabase/supabase-js@2** — auth + database

All UI state lives in memory + `localStorage`. Saved reports persist in Supabase Postgres (`public.reports`), scoped per user by RLS.

> Legacy: `app.py` (Flask + SQLite `reports.db`) is retained only for local dev. Production no longer uses it; the old `/api/reports` REST endpoints are replaced by direct Supabase queries.

---

## File Location
`business_plan_tool.html` — the whole app (HTML+CSS+JS in two inline `<script>` blocks). Served statically at `/`.

## Supabase Architecture
- **Config:** `SUPABASE_URL` + `SUPABASE_ANON_KEY` constants at the top of the main `<script>` (~line 1172). Anon key is safe to expose; security is enforced by RLS. **Never** put the `service_role` key in the HTML.
- **Client:** `const sb = window.supabase.createClient(...)`; `let CURRENT_USER` holds the logged-in user.
- **Table `public.reports`:** `id, user_id (uuid, default auth.uid()), name, created_at (timestamptz), plan_code, scope, state_json (text), summary_json (text)`.
- **RLS:** select/insert/delete policies all require `auth.uid() = user_id` → each user sees only their own reports.
- **Auth:** email/password. Public sign-up disabled; admin creates users in Supabase Studio.
- **Deploy:** nginx serves the HTML; Supabase self-hosted on a Proxmox VM; HTTPS via Let's Encrypt; access via DDNS + port-forward 443.

## Data helpers (replace the old fetch/REST layer)
| Helper | Supabase call |
|---|---|
| `dbListReports()` | `sb.from('reports').select('id,name,created_at,plan_code,scope,summary_json').order('created_at',{ascending:false})` |
| `dbSaveReport(body)` | `sb.from('reports').insert({...}).select('id').single()` |
| `dbGetReport(id)` | `sb.from('reports').select('*').eq('id',id).single()` |
| `dbDeleteReport(id)` | `sb.from('reports').delete().eq('id',id)` |
| `dbListComparisons()` | `sb.from('plan_comparisons').select('id,name,year,report_ids,created_at').order(...)` |
| `dbSaveComparison(body)` | `sb.from('plan_comparisons').insert({...}).select('id').single()` |
| `dbGetComparison(id)` | `sb.from('plan_comparisons').select('*').eq('id',id).single()` |
| `dbUpdateComparison(id,body)` | `sb.from('plan_comparisons').update({name,notes_json}).eq('id',id)` |
| `dbDeleteComparison(id)` | `sb.from('plan_comparisons').delete().eq('id',id)` |

## Auth gate
- `#authGate` overlay (after `<body>`) covers the app until login. `.app` starts `display:none`.
- `showApp()` / `showAuthGate()` toggle visibility; `login(ev)` → `sb.auth.signInWithPassword`; `logout()` → `sb.auth.signOut()` + reload.
- Bootstrap IIFE at the end of the main script calls `sb.auth.getSession()` and registers `onAuthStateChange`.
- Replaces the old `IS_FLASK` guard: feature guards now check `if(!CURRENT_USER){...}`.

## Report Persistence (DB)
- `state_json` = same format as `getStateJson()` (v:2 schema; full CSV text included)
- `summary_json` = `{base, net, churn, systems, churnCount}` for list display (stored as TEXT, `JSON.parse`d in JS)
- `LS_KEY` is namespaced per user (`jjv_bp_session_<user_id>`) so accounts on a shared PC don't cross autosaves.

## Plan Comparison (BP / JU / NU)
Dedicated view to compare the three yearly revisions of the forecast by platform — replaces the manual Excel workflow.
- **Entry:** `📊 Plan Compare` toolbar button → `openPlanCmpModal()` builder (assign a saved report to BP/JU/NU slots; ≥2 required).
- **Table `public.plan_comparisons`:** `id, user_id (default auth.uid()), name, year, report_ids (TEXT JSON: `[{label,id}]`), notes_json (TEXT JSON), created_at`. RLS select/insert/**update**/delete all require `auth.uid() = user_id`.
- **`computePlanBreakdown(st)`** (sibling of `computeSummaryFrom`): returns `{platformType:{[plat]:{Direct,Bundle}}, bySerial:{[Serial_number]:{rev,platform,bucket,account}}, totals:{Direct,Bundle,grand}, noSerialCount}`. Value per cell = **retained, in-scope** revenue (excludes churn + `isHX`). Bucket from `Direct_vs_bundle_revenue`: Direct→**Contract**, Bundle→**Reclass**.
- **`diffRevisions(brkA,brkB)`** matches contracts across revisions by `Serial_number` → `{appeared, disappeared, changed}` (the "discrepancy drivers"). Rows without a serial are summed into platform totals but excluded from matching (surfaced via `noSerialCount`).
- **Overlay `#planCmpOvl`:** two blocks (Contract/Reclass) × platform rows × revision columns + chained variance columns (BP→JU, JU→NU) + per-platform editable Comments; grand TOTAL = latest revision's Direct+Bundle; discrepancy-driver lists with editable per-contract notes (pre-filled like `+20k Oftalmplus`); free-text notes box.
- **Comments persistence:** three levels stored in `notes_json` = `{platformComments:{'Contract|Plat':...}, serialNotes:{'BP→JU|SN':...}, freeText}`, collected from the DOM via `_pcCollectNotes()` on save. Save = insert (or update when `_planCmp.editingId` set).
- **Export:** `exportPlanCompareXlsx()` reuses the global `XLSX` (SheetJS) → sheets Contract, Reclass, Drivers, Notes.

---

## Data Flow
1. User uploads a CSV exported from Alteryx via `<input type="file">`
2. PapaParse parses with **ISO-8859-1** encoding
3. Each row is enriched on load:
   - `_id` — row index (string key)
   - `_rev` — revenue as float
   - `_days` — days to contract expiry (negative = expired)
   - `_cluster` — cluster label
4. Enriched rows stored in `S.raw` → all rendering derives from this

---

## State Object `S`
```js
S = {
  raw: [],          // all enriched CSV rows
  cRev: {},         // manual revenue overrides {_id: value}
  churn: Set,       // Set of _ids marked as churned
  risks: [],        // [{id, cust, desc, prob, impact}]
  opps: [],         // [{id, cust, type, qtr, revenue}]
  assumps: [],      // [{id, cat, txt}]
  filt: { countries: Set, clusters: Set, platforms: Set, coverage: Set },
  sort: { col, dir },
  page: 0, ps: 25,
  charts: {},       // Chart.js instances (Systems tab)
  iCharts: {},      // Chart.js instances (Insights/Report tab)
  _csv: ''          // raw CSV text (for localStorage restore)
}
```

---

## Key Helper Functions

| Function | Purpose |
|---|---|
| `isTM(r)` | True if `Coverage_type` contains "T&M" — auto-churned on load |
| `isHX(r)` | True if `_days < -356` — expired >1 year, excluded from base revenue |
| `getRev(r)` | Returns `S.cRev[r._id]` override first, then `r._rev` |
| `getFiltered()` | Applies `S.filt` filters to `S.raw`, returns filtered rows |
| `calcSummary(rows)` | Returns `{base, retRev, chnRev, diffRev, riskW, oppUp, net, counts…}` |
| `renderAll()` | Master re-render — calls all tab renderers + `autoSave()` |
| `autoSave()` | Serializes full state to `localStorage` key `jjv_bp_session` |
| `restoreSession()` | Reads localStorage, re-parses CSV text, restores all state |
| `updateInsight(f, sm)` | Builds Systems tab insight strip + benchmark vs all-countries avg |
| `buildEmailHTML()` | Generates full Outlook-compatible HTML email string (inline styles, no rgba) |

---

## Revenue Logic
- **Base** = sum of in-scope retained contracts (`!isHX(r) && !S.churn.has(r._id)`)
- **Churn** = sum of churned contracts (`S.churn`)
- **Difficult** = sum of `isHX(r)` rows — excluded from base, shown separately
- **T&M contracts** — `isTM(r)` → auto-added to churn on CSV load
- **Net** = `retRev - riskW + oppUp`

---

## Tab Structure

| Tab | `data-tab` | Accent Color | Purpose |
|---|---|---|---|
| Systems | `systems` | Teal | Main table, KPI bar, charts, filters |
| Risks | `risks` | Red | Risk register with prob/impact/weighted |
| Opportunities | `opps` | Blue | Opportunity pipeline by account |
| Insights | `insights` | Purple | Generated report (print / email) |
| Assumptions | `assump` | Amber | Free-text assumptions by category |

Tab accent colors are applied via `data-tab` CSS attribute selectors on `.tbtn`.

---

## Report (Insights Tab)
Rendered into `#rptOvl` overlay. Sections:
1. Cover page (`.rcov`)
2. Revenue Analysis — Direct/Bundle allocation tables by Platform + avg benchmark tables
3. Coverage & Type charts
4. Expiry timeline
5. Top accounts + country breakdown

**Print:** `window.print()` — `@media print` CSS forces single-column charts (`grid-template-columns:1fr`), `break-inside:avoid` on `.rsec`/`.rchart-w`, A4 portrait with 1.5cm margins.

**Email modal:**
- Preview rendered in `<iframe id="emlFrame">` (sandboxed)
- **Copy HTML** button uses `ClipboardItem({'text/html': Blob})` → paste as formatted HTML in Outlook/Gmail
- **Open Email Client** uses `mailto:` with plain text key figures in body
- `buildEmailHTML()` uses `bgcolor` attributes + no `rgba()` for Outlook compatibility

---

## Session Persistence
- `LS_KEY = 'jjv_bp_session'`
- `autoSave()` runs on every `renderAll()` — saves CSV text + churn + cRev + risks + opps + assumps + filters
- On next open a restore banner appears — one click restores full session without re-uploading CSV

---

## Favicon
Embedded as PNG base64 `data:` URL in `<link rel="icon">`. A separate `business_plan_tool.ico` file exists in the same folder for use with Windows shortcuts.

---

## Editing Guidelines — IMPORTANT

### Always validate JS after edits
There are now **two** inline `<script>` blocks (a tiny theme-init one ~line 616, and the main app block ~line 1191). Extract the **second** (main) block to validate:
```bash
# Extract main JS block and check syntax
python3 -c "
c=open('business_plan_tool.html',encoding='utf-8').read()
i=c.find('<script>', c.find('<script>')+1)  # second <script>
j=c.rfind('</script>')
open('_check.js','w',encoding='utf-8').write(c[i+8:j])
"
node --check _check.js && rm -f _check.js
```

### Use Python str.replace() for edits — NOT Write tool
The file is ~1910 lines. The Write tool is unreliable at this size. Always use targeted Python replacements:
```python
c = open('business_plan_tool.html').read()
c2 = c.replace(OLD, NEW, 1)
assert c2 != c, "Replacement not found"
open('business_plan_tool.html', 'w').write(c2)
```

### Template literals inside Python heredocs — FORBIDDEN
Never use JS backtick strings inside Python `<< 'EOF'` blocks. Use string concatenation instead:
```js
// BAD  (breaks Python heredoc)
'<td>' + `${value}` + '</td>'

// GOOD
'<td>' + value + '</td>'
```

### Chart instances — always destroy before recreating
```js
if (S.charts.myChart) { S.charts.myChart.destroy(); }
S.charts.myChart = new Chart(ctx, config);
```

### Brace balance check
```bash
python3 -c "
c=open('business_plan_tool.html',encoding='utf-8').read()
i=c.find('<script>', c.find('<script>')+1)
js=c[i+8:c.rfind('</script>')]
print('{ =', js.count('{'), '} =', js.count('}'))
"
```
`{` count must equal `}` count.

### rgba() not allowed in email HTML
`buildEmailHTML()` must use solid hex colors only — Outlook strips `rgba()`.

---

## CSV Expected Columns (from Alteryx export)
Key columns used by the tool:

| Column | Usage |
|---|---|
| `Coverage_type` | Detect T&M contracts (`isTM`) |
| `Platform` | Chart grouping, benchmark tables |
| `account_name` | Display name, top accounts ranking |
| `_days` | Days to expiry (computed by Alteryx) |
| `_rev` | Contract revenue value |
| `_cluster` | Regional cluster grouping |
| `country` | Country filter |

