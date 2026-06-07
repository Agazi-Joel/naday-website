# finance-data/

This folder holds the Naday finance system's **data**. Everything here is
**gitignored except this README and `sample/`** — your real bank statements,
ledger, balance sheet, and dashboard are *never committed* and *never published*
to the website.

## Layout
```
finance-data/
  raw/          ← drop your bank/credit-card CSV exports here
  ledger/       ← ledger.csv  (auto-generated normalized transactions)
  output/       ← finances.json + dashboard.html  (auto-generated)
  accounts.json ← your accounts (copy from ../.claude/skills/finance/config/accounts.example.json)
  sample/       ← synthetic demo data (safe, committed)
```
`raw/`, `ledger/`, `output/`, and `accounts.json` are created on first run.

## Use it
See the skill: `.claude/skills/finance/SKILL.md`. Short version:
```
# one-time: tell it about your accounts
cp .claude/skills/finance/config/accounts.example.json finance-data/accounts.json
#   then edit accounts.json

# each time you have new statements:
#   1) drop CSV exports into finance-data/raw/
#   2) run the pipeline:
python3 .claude/skills/finance/scripts/run_all.py
#   3) open finance-data/output/dashboard.html
```

## Try the demo
```
mkdir -p finance-data/raw && cp finance-data/sample/*.csv finance-data/raw/
cp .claude/skills/finance/config/accounts.example.json finance-data/accounts.json
python3 .claude/skills/finance/scripts/run_all.py
```

## ⚠️ Privacy
This repository is published to GitHub Pages (a public website). **Do not remove
the gitignore rules and do not `git add -f` anything in here.** If you ever need
to share figures, share the generated `dashboard.html` directly — don't commit it.
