---
name: finance
description: Finance team orchestrator. Ingest bank/credit-card statements (CSV/Excel), build a balance sheet, P&L and cash-flow, and generate a local HTML financial-planning dashboard. Use when the user wants to process bank statements, update their finances/balance sheet/net worth, refresh the dashboard, or do financial planning, budgeting, runway, or forecasting.
---

# Naday Finance Team

A small team of agents that turn raw bank statements into a balance sheet and a
local financial-planning dashboard. **All money math is done by Python scripts**
(never by an LLM), and **all real financial data stays in the gitignored
`finance-data/` folder** so it can never be published to the public website repo.

## The team
| Agent | Role |
|---|---|
| `finance-statement-ingestor` | raw CSV/Excel → clean, deduped, categorized ledger |
| `finance-categorizer` | improves the rules so the spending breakdown is trustworthy |
| `finance-bookkeeper` | builds & reconciles the balance sheet / P&L / cash flow |
| `finance-analyst` | the planner: runway, burn, scenarios, recommendations |
| `finance-dashboard-builder` | renders the self-contained HTML dashboard |

## Folder layout
```
finance-data/                 (gitignored — your real data; never committed)
  raw/          drop bank CSV exports here
  ledger/       ledger.csv      (normalized, categorized transactions)
  output/       finances.json + dashboard.html
  accounts.json your accounts (copy from config/accounts.example.json)
  sample/       synthetic demo data (committed, safe)
.claude/skills/finance/
  scripts/      normalize.py · bookkeep.py · dashboard.py · run_all.py
  config/       categories.json · accounts.example.json
  reference/    bank-formats.md
```

## Quick start (one command)
1. Export transactions from each bank account as **CSV** and drop them in
   `finance-data/raw/`. (Excel: "Save As CSV" first.)
2. Copy `config/accounts.example.json` → `finance-data/accounts.json` and set
   each account's `type` (asset/liability) and `opening_balance`.
3. Run the whole pipeline:
   ```
   python3 .claude/skills/finance/scripts/run_all.py
   ```
4. Open the dashboard: `finance-data/output/dashboard.html`.

Try it right now on the sample data:
```
mkdir -p finance-data/raw && cp finance-data/sample/*.csv finance-data/raw/
cp .claude/skills/finance/config/accounts.example.json finance-data/accounts.json
python3 .claude/skills/finance/scripts/run_all.py
```

## How to orchestrate (what you, the assistant, should do)
When the user invokes this skill, route to the right step — delegate to the
specialist subagents via the Agent tool for non-trivial work:

1. **New statements present** (`finance-data/raw/` has files) → delegate to
   `finance-statement-ingestor`. Then, if many rows are "Uncategorized",
   delegate to `finance-categorizer`.
2. **Build/refresh statements** → delegate to `finance-bookkeeper` (it ensures
   `accounts.json` is right and reconciles).
3. **Build/refresh the dashboard** → delegate to `finance-dashboard-builder`.
4. **"How are we doing?" / planning / forecasting** → delegate to
   `finance-analyst`.
5. **Everything at once** → run `run_all.py`, then hand the result to
   `finance-analyst` for a written read-out.

For a simple end-to-end refresh you can just run `run_all.py` yourself; reach for
the subagents when there's judgment involved (weird formats, categorization,
reconciliation gaps, analysis).

## Guardrails
- **Never commit real financial data.** Everything under `finance-data/` (except
  `README.md` and `sample/`) is gitignored. Don't `git add -f` it. Don't paste
  real balances into files that get committed.
- **No LLM arithmetic on money.** If a number is wrong, fix the source data or the
  script — don't "correct" totals by hand.
- The dashboard is generated; edit `dashboard.py` and regenerate, don't hand-edit
  the HTML.
- This is planning support from bank cash flows, not audited accounting or tax/
  investment advice. Reconcile against source statements before acting; consult a
  professional for filing/investment/legal decisions.
- First time setup: if `python3` lacks nothing — the scripts are pure standard
  library, so no `pip install` is required.
