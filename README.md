# JJV Business Plan Tool

A desktop application for J&J MedTech Technical Service business planning — contract revenue analysis, risk/opportunity tracking, and report generation.

Built with Flask + SQLite, packaged as a standalone Windows `.exe` via PyInstaller.

---

## Features

- **Contract revenue analysis** — load an Alteryx CSV export and instantly see base revenue, churn, T&M contracts, and expired deals
- **Filters** — slice by country, cluster, platform, and coverage type
- **Revenue overrides** — manually adjust contract values without editing the source file
- **Churn management** — mark contracts as churned; T&M contracts auto-churn on load
- **Risk register** — log risks with probability, impact, and weighted value
- **Opportunity pipeline** — track upsides by account, type, and quarter
- **Assumptions log** — categorised free-text assumptions for audit trail
- **Insights report** — full printable/emailable business plan report with charts, top accounts, country breakdown, and expiry timeline
- **Email export** — copy Outlook-compatible HTML to clipboard or open via `mailto:`
- **Report history** — save named snapshots to a local SQLite database and restore any previous session
- **Report comparison** — compare any two saved reports side-by-side with Δ and % change, colour-coded green/red
- **Undo / Redo** — two-stack history with `Ctrl+Z` / `Ctrl+Y`
- **Light / Dark mode** — toggle in the header, preference saved across sessions
- **Session persistence** — full state auto-saved to `localStorage` on every change; restore banner on next open

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.x + Flask 3.x |
| Database | SQLite (Python built-in `sqlite3`) |
| Frontend | Vanilla JS + HTML/CSS (single file) |
| CSV parsing | PapaParse 5.4.1 (CDN) |
| Charts | Chart.js 4.4.1 (CDN) |
| Packaging | PyInstaller (one-file `.exe`) |

No Node.js, no build step, no external database server required.

---

## Project Structure

```
Bussines_plan_tool/
├── app.py                    # Flask server + SQLite API
├── business_plan_tool.html   # Full frontend (served by Flask)
├── build_exe.spec            # PyInstaller build spec
├── requirements.txt          # Python dependencies
├── business_plan_tool.ico    # App icon (Windows)
└── reports.db                # SQLite DB (auto-created on first run, not committed)
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- pip

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run in development

```bash
python app.py
```

Opens `http://localhost:5000` automatically in your default browser.

---

## Build the Windows Executable

```bash
pip install pyinstaller
pyinstaller build_exe.spec --distpath dist --workpath build
```

Output: `dist/JJV_BusinessPlanTool.exe` (~15 MB, fully self-contained).

The `reports.db` file is created next to the `.exe` on first launch.

> **To rebuild after changes:** stop the running `.exe` first, then delete `build/` and `dist/` before re-running PyInstaller.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Serve the frontend |
| `GET` | `/api/reports` | List saved reports |
| `POST` | `/api/reports` | Save a new report |
| `GET` | `/api/reports/<id>` | Get full report (includes state) |
| `DELETE` | `/api/reports/<id>` | Delete a report |

API features are only active when served over `http:` (i.e. via Flask). Opening the HTML directly as `file://` disables DB features gracefully.

---

## CSV Format

The tool expects a CSV exported from Alteryx with at least these columns:

| Column | Description |
|---|---|
| `account_name` | Customer / account display name |
| `Coverage_type` | Contract type — T&M contracts auto-churn |
| `Platform` | Product platform for grouping and charts |
| `country` | Country for filtering |
| `_days` | Days to contract expiry (computed by Alteryx) |
| `_rev` | Contract annual revenue value |
| `_cluster` | Regional cluster grouping |

Parsed with **ISO-8859-1** encoding to handle special characters in account names.

---

## Report History & Sharing

Each user's history is stored in a local `reports.db` beside the `.exe`. To share saved reports with a colleague, copy the `reports.db` file to the same folder as their `.exe`.

---

## License

Internal tool — J&J MedTech Technical Service. Not for public distribution.
