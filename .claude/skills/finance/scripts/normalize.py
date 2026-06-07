#!/usr/bin/env python3
"""
normalize.py — turn messy bank CSV exports into one clean, categorized ledger.

Pure standard library (no pandas needed).

What it does
------------
1. Reads every raw CSV under finance-data/raw/  (or the files you pass).
2. Auto-detects the date / description / amount (or debit+credit) columns,
   even though every bank names them differently.
3. Normalizes dates to YYYY-MM-DD and amounts to a single signed number
   (positive = money IN, negative = money OUT).
4. Applies the rules in config/categories.json to label each line.
5. De-duplicates and writes finance-data/ledger/ledger.csv.

Excel files (.xlsx): open in Excel/Numbers/Sheets and "Save As CSV", then
drop the CSV into finance-data/raw/. (Keeps this tool dependency-free.)

Usage
-----
  python3 normalize.py                         # process everything in raw/
  python3 normalize.py path/to/statement.csv   # process one file
  python3 normalize.py file.csv --account "TD Chequing"
  python3 normalize.py file.csv --flip-sign    # if your bank lists spend as positive
"""

import csv
import json
import os
import re
import sys
import hashlib
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(HERE)
# finance-data lives at the repo root: .../<repo>/finance-data
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
DATA_DIR = os.environ.get("FINANCE_DATA_DIR", os.path.join(REPO_ROOT, "finance-data"))
RAW_DIR = os.path.join(DATA_DIR, "raw")
LEDGER_DIR = os.path.join(DATA_DIR, "ledger")
LEDGER_PATH = os.path.join(LEDGER_DIR, "ledger.csv")
CATEGORIES_PATH = os.path.join(SKILL_DIR, "config", "categories.json")

LEDGER_FIELDS = ["date", "account", "description", "amount",
                 "category", "kind", "balance", "source_file"]

# --- column name synonyms (lower-cased, matched as substrings) ---------------
SYN = {
    "date":        ["posting date", "posted date", "transaction date", "trans date",
                    "date posted", "value date", "date"],
    "description": ["description", "narrative", "details", "memo", "payee",
                    "name", "merchant", "particulars", "transaction", "desc"],
    "amount":      ["amount", "transaction amount", "amt"],
    "debit":       ["debit", "withdrawal", "withdrawals", "money out",
                    "paid out", "outflow", "dr"],
    "credit":      ["credit", "deposit", "deposits", "money in",
                    "paid in", "inflow", "cr"],
    "balance":     ["running balance", "ledger balance", "balance"],
}

DATE_FORMATS = ["%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%d/%m/%Y", "%m/%d/%y",
                "%d/%m/%y", "%d-%b-%Y", "%d-%b-%y", "%b %d, %Y", "%d %b %Y",
                "%m-%d-%Y", "%Y%m%d"]


def load_categories():
    with open(CATEGORIES_PATH, encoding="utf-8") as f:
        cfg = json.load(f)
    rules = []
    for r in cfg.get("rules", []):
        pats = [re.compile(p, re.IGNORECASE) for p in r.get("patterns", [])]
        rules.append((r["category"], r.get("kind", "expense"), pats))
    return rules, cfg.get("default_income", "Other income"), \
        cfg.get("default_expense", "Uncategorized")


def categorize(desc, amount, rules, default_income, default_expense):
    for category, kind, pats in rules:
        if any(p.search(desc) for p in pats):
            return category, kind
    if amount >= 0:
        return default_income, "income"
    return default_expense, "expense"


def find_col(header, keys):
    """Return index of the first header cell matching any synonym in keys."""
    low = [h.strip().lower() for h in header]
    for key in keys:
        for i, h in enumerate(low):
            if h == key:
                return i
    for key in keys:                    # fall back to substring match
        for i, h in enumerate(low):
            if key in h:
                return i
    return None


def parse_date(raw):
    raw = (raw or "").strip()
    if not raw:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    # last resort: pull a YYYY-MM-DD-ish token out of the string
    m = re.search(r"(\d{4})\D(\d{1,2})\D(\d{1,2})", raw)
    if m:
        y, mo, d = m.groups()
        try:
            return datetime(int(y), int(mo), int(d)).strftime("%Y-%m-%d")
        except ValueError:
            return None
    return None


def parse_amount(raw):
    if raw is None:
        return None
    s = str(raw).strip()
    if s == "" or s in {"-", "--"}:
        return None
    neg = False
    if s.startswith("(") and s.endswith(")"):   # accounting negatives
        neg, s = True, s[1:-1]
    s = s.replace("$", "").replace("£", "").replace("€", "").replace(",", "").replace(" ", "")
    if s.endswith("-"):                          # trailing-minus banks
        neg, s = True, s[:-1]
    try:
        val = float(s)
    except ValueError:
        return None
    return -val if neg else val


def sniff_reader(path):
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as f:
        sample = f.read(4096)
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel
    return dialect


def detect_header(rows):
    """Many bank CSVs have preamble lines; find the row that looks like a header."""
    best_i, best_score = 0, -1
    for i, row in enumerate(rows[:15]):
        low = [c.strip().lower() for c in row]
        score = sum(1 for group in SYN.values()
                    for key in group if any(key == c or key in c for c in low))
        if score > best_score:
            best_i, best_score = i, score
    return best_i


def process_file(path, account=None, flip_sign=False):
    dialect = sniff_reader(path)
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as f:
        rows = [r for r in csv.reader(f, dialect) if any(c.strip() for c in r)]
    if not rows:
        return []

    h = detect_header(rows)
    header, body = rows[h], rows[h + 1:]

    i_date = find_col(header, SYN["date"])
    i_desc = find_col(header, SYN["description"])
    i_amt = find_col(header, SYN["amount"])
    i_deb = find_col(header, SYN["debit"])
    i_cred = find_col(header, SYN["credit"])
    i_bal = find_col(header, SYN["balance"])

    if i_date is None or i_desc is None or (i_amt is None and i_deb is None and i_cred is None):
        print(f"  ! Skipping {os.path.basename(path)}: could not find date/description/amount "
              f"columns. Header was: {header}")
        return []

    acct = account or os.path.splitext(os.path.basename(path))[0]
    out = []
    for row in body:
        if max(i for i in [i_date, i_desc, i_amt, i_deb, i_cred, i_bal]
               if i is not None) >= len(row):
            continue
        date = parse_date(row[i_date])
        if not date:
            continue
        desc = re.sub(r"\s+", " ", row[i_desc]).strip()

        if i_amt is not None:
            amount = parse_amount(row[i_amt])
        else:
            deb = parse_amount(row[i_deb]) if i_deb is not None else None
            cred = parse_amount(row[i_cred]) if i_cred is not None else None
            amount = (cred or 0.0) - abs(deb or 0.0)
        if amount is None:
            continue
        if flip_sign:
            amount = -amount

        balance = parse_amount(row[i_bal]) if i_bal is not None else None
        out.append({
            "date": date, "account": acct, "description": desc,
            "amount": round(amount, 2), "balance": balance,
            "source_file": os.path.basename(path),
        })
    print(f"  + {os.path.basename(path)}: {len(out)} rows  (account: {acct})")
    return out


def row_key(r):
    return hashlib.md5(
        f"{r['date']}|{r['account']}|{r['description']}|{r['amount']}".encode()
    ).hexdigest()


def load_existing():
    if not os.path.exists(LEDGER_PATH):
        return [], set()
    with open(LEDGER_PATH, newline="", encoding="utf-8") as f:
        existing = list(csv.DictReader(f))
    return existing, {row_key(r) for r in existing}


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    account = None
    flip_sign = "--flip-sign" in argv
    if "--account" in argv:
        idx = argv.index("--account")
        account = argv[idx + 1] if idx + 1 < len(argv) else None
        args = [a for a in args if a != account]

    files = [a for a in args if a.lower().endswith(".csv")]
    if not files:
        if not os.path.isdir(RAW_DIR):
            print(f"No files given and {RAW_DIR} does not exist.\n"
                  f"Drop your bank CSV exports in finance-data/raw/ and re-run.")
            return 1
        files = sorted(os.path.join(RAW_DIR, f) for f in os.listdir(RAW_DIR)
                       if f.lower().endswith(".csv"))
    if not files:
        print(f"No CSV files found in {RAW_DIR}.")
        return 1

    rules, di, de = load_categories()
    print(f"Normalizing {len(files)} file(s)...")
    parsed = []
    for path in files:
        parsed.extend(process_file(path, account=account, flip_sign=flip_sign))

    for r in parsed:
        cat, kind = categorize(r["description"], r["amount"], rules, di, de)
        r["category"], r["kind"] = cat, kind

    existing, seen = load_existing()
    added = 0
    for r in parsed:
        k = row_key(r)
        if k in seen:
            continue
        seen.add(k)
        existing.append(r)
        added += 1

    existing.sort(key=lambda r: (r["date"], r["account"]))
    os.makedirs(LEDGER_DIR, exist_ok=True)
    with open(LEDGER_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=LEDGER_FIELDS)
        w.writeheader()
        for r in existing:
            w.writerow({k: ("" if r.get(k) is None else r.get(k, "")) for k in LEDGER_FIELDS})

    print(f"\nDone. {added} new row(s) added, {len(existing)} total in ledger.")
    print(f"Ledger: {LEDGER_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
