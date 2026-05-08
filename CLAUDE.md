# JJV Business Plan Tool — Claude Code Instructions

## Overview
Flask + SQLite desktop app. Entry point: `app.py` (Flask server on `localhost:5000`).
HTML is served by Flask — open via `JJV_BusinessPlanTool.exe` (or `python app.py` in dev).
Dependencies loaded from CDN:
- **PapaParse 5.4.1** — CSV parsing
- **Chart.js 4.4.1** — charts

All UI state lives in memory + `localStorage`. Report history persists in `reports.db` (SQLite, beside the .exe).

---

## File Location
`business_plan_tool.html` — served by Flask at `GET /`. Current size ~2150 lines.

## Flask Architecture
- `app.py` — Flask server + SQLite API. Run with `python app.py` for dev; opens browser automatically.
- `reports.db` — SQLite DB, created on first run beside the .exe (or script in dev).
- `build_exe.spec` — PyInstaller spec → `pyinstaller build_exe.spec` → `dist/JJV_BusinessPlanTool.exe`
- `requirements.txt` — `flask>=3.0.0`

## API Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Serve `business_plan_tool.html` |
| GET | `/api/reports` | List saved reports (id, name, created_at, plan_code, scope, summary_json) |
| POST | `/api/reports` | Save report `{name, plan_code, scope, state_json, summary}` |
| GET | `/api/reports/<id>` | Get full report (includes `state_json`) |
| DELETE | `/api/reports/<id>` | Delete report |

## Report Persistence (DB)
- `state_json` = same format as `autoSave()` localStorage payload (v:2 schema)
- `summary_json` = `{base, net, churn, systems}` for list display
- `IS_FLASK = window.location.protocol === 'http:'` — JS guards DB features when opened as file://

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
```bash
# Extract JS and check syntax
python3 -c "
c=open('business_plan_tool.html').read()
i=c.find('<script>')
j=c.rfind('</script>')
open('/tmp/check.js','w').write(c[i+8:j])
"
node --check /tmp/check.js
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
c=open('business_plan_tool.html').read()
js=c[c.find('<script>')+8:c.rfind('</script>')]
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

