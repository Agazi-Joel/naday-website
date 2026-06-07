#!/usr/bin/env python3
"""
bookkeep.py — turn the normalized ledger into financial statements.

Pure standard library. Reads finance-data/ledger/ledger.csv and writes
finance-data/output/finances.json containing:

  * balance_sheet : assets / liabilities / equity (per account + totals)
  * pnl           : income, expenses, net by month and overall
  * by_category   : expense and income totals by category
  * cash_series   : total cash position over time (for the line chart)
  * kpis          : headline numbers (net, avg monthly burn, runway, ...)
  * forecast      : naive 6-month cash projection from recent trend
  * recent        : the most recent transactions (for the dashboard table)

ALL arithmetic happens here in Python — never trust an LLM to add money up.
"""

import csv
import json
import os
import sys
from collections import defaultdict
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(HERE)
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
DATA_DIR = os.environ.get("FINANCE_DATA_DIR", os.path.join(REPO_ROOT, "finance-data"))
LEDGER_PATH = os.path.join(DATA_DIR, "ledger", "ledger.csv")
ACCOUNTS_PATH = os.path.join(DATA_DIR, "accounts.json")
OUTPUT_DIR = os.path.join(DATA_DIR, "output")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "finances.json")


def money(x):
    return round(float(x), 2)


def load_ledger():
    if not os.path.exists(LEDGER_PATH):
        print(f"No ledger at {LEDGER_PATH}. Run normalize.py first.")
        sys.exit(1)
    rows = []
    with open(LEDGER_PATH, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            r["amount"] = float(r["amount"]) if r["amount"] else 0.0
            r["balance"] = float(r["balance"]) if r.get("balance") else None
            rows.append(r)
    rows.sort(key=lambda r: r["date"])
    return rows


def load_accounts(ledger):
    """Account metadata: type (asset/liability), opening balance, label."""
    meta = {}
    if os.path.exists(ACCOUNTS_PATH):
        with open(ACCOUNTS_PATH, encoding="utf-8") as f:
            for a in json.load(f).get("accounts", []):
                meta[a["account"]] = a
    # default any account not in the config to an asset with 0 opening balance
    for acct in {r["account"] for r in ledger}:
        meta.setdefault(acct, {"account": acct, "type": "asset",
                               "opening_balance": 0.0, "label": acct})
    return meta


def month_of(date_str):
    return date_str[:7]  # YYYY-MM


def build(ledger, accounts):
    # ---- per-account ending balances --------------------------------------
    acct_balances = {}
    for acct, meta in accounts.items():
        rows = [r for r in ledger if r["account"] == acct]
        explicit = [r["balance"] for r in rows if r["balance"] is not None]
        if explicit:
            ending = explicit[-1]                      # trust the bank's running balance
        else:
            ending = meta.get("opening_balance", 0.0) + sum(r["amount"] for r in rows)
        acct_balances[acct] = money(ending)

    # ---- balance sheet -----------------------------------------------------
    assets, liabilities = [], []
    for acct, meta in sorted(accounts.items()):
        entry = {"account": acct, "label": meta.get("label", acct),
                 "balance": acct_balances[acct]}
        if meta.get("type") == "liability":
            # liabilities are carried as positive magnitudes owed
            entry["balance"] = abs(entry["balance"])
            liabilities.append(entry)
        else:
            assets.append(entry)
    total_assets = money(sum(a["balance"] for a in assets))
    total_liabilities = money(sum(l["balance"] for l in liabilities))
    balance_sheet = {
        "assets": assets, "liabilities": liabilities,
        "total_assets": total_assets, "total_liabilities": total_liabilities,
        "equity": money(total_assets - total_liabilities),
    }

    # ---- P&L by month (transfers excluded) --------------------------------
    monthly = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    inc_by_cat = defaultdict(float)
    exp_by_cat = defaultdict(float)
    total_income = total_expense = 0.0
    for r in ledger:
        if r["kind"] == "transfer":
            continue
        m = month_of(r["date"])
        if r["amount"] >= 0:
            monthly[m]["income"] += r["amount"]
            total_income += r["amount"]
            inc_by_cat[r["category"]] += r["amount"]
        else:
            spend = -r["amount"]
            monthly[m]["expense"] += spend
            total_expense += spend
            exp_by_cat[r["category"]] += spend

    pnl_months = []
    for m in sorted(monthly):
        inc = money(monthly[m]["income"])
        exp = money(monthly[m]["expense"])
        pnl_months.append({"month": m, "income": inc, "expense": exp,
                           "net": money(inc - exp)})

    by_category = {
        "expense": sorted(({"category": k, "amount": money(v)}
                           for k, v in exp_by_cat.items()),
                          key=lambda x: -x["amount"]),
        "income": sorted(({"category": k, "amount": money(v)}
                          for k, v in inc_by_cat.items()),
                         key=lambda x: -x["amount"]),
    }

    # ---- cash position over time (asset accounts only) --------------------
    asset_accts = {a for a, m in accounts.items() if m.get("type") != "liability"}
    opening_cash = sum(accounts[a].get("opening_balance", 0.0) for a in asset_accts)
    running = opening_cash
    cash_series = []
    last_by_month = {}
    for r in ledger:
        if r["account"] in asset_accts:
            running += r["amount"]
        last_by_month[month_of(r["date"])] = money(running)
    for m in sorted(last_by_month):
        cash_series.append({"month": m, "cash": last_by_month[m]})

    # ---- KPIs --------------------------------------------------------------
    n_months = max(len(pnl_months), 1)
    avg_income = money(total_income / n_months)
    avg_expense = money(total_expense / n_months)
    avg_net = money((total_income - total_expense) / n_months)
    current_cash = balance_sheet["total_assets"]
    runway = None
    if avg_net < 0:
        runway = round(current_cash / abs(avg_net), 1)
    kpis = {
        "current_cash": current_cash,
        "net_worth": balance_sheet["equity"],
        "total_income": money(total_income),
        "total_expense": money(total_expense),
        "net": money(total_income - total_expense),
        "avg_monthly_income": avg_income,
        "avg_monthly_expense": avg_expense,
        "avg_monthly_net": avg_net,
        "months_covered": n_months,
        "runway_months": runway,
        "savings_rate": money(100 * (total_income - total_expense) / total_income)
                        if total_income else None,
    }

    # ---- naive 6-month forecast -------------------------------------------
    forecast = []
    proj = current_cash
    if cash_series:
        last_month = cash_series[-1]["month"]
        y, mo = int(last_month[:4]), int(last_month[5:7])
        for _ in range(6):
            mo += 1
            if mo > 12:
                mo, y = 1, y + 1
            proj = money(proj + avg_net)
            forecast.append({"month": f"{y:04d}-{mo:02d}", "cash": proj})

    recent = sorted(ledger, key=lambda r: r["date"], reverse=True)[:25]
    recent = [{"date": r["date"], "account": r["account"],
               "description": r["description"], "amount": money(r["amount"]),
               "category": r["category"]} for r in recent]

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "period": {"from": ledger[0]["date"], "to": ledger[-1]["date"],
                   "transactions": len(ledger)},
        "balance_sheet": balance_sheet,
        "kpis": kpis,
        "pnl": {"months": pnl_months,
                "total_income": money(total_income),
                "total_expense": money(total_expense),
                "net": money(total_income - total_expense)},
        "by_category": by_category,
        "cash_series": cash_series,
        "forecast": forecast,
        "recent": recent,
    }


def main():
    ledger = load_ledger()
    if not ledger:
        print("Ledger is empty.")
        return 1
    accounts = load_accounts(ledger)
    result = build(ledger, accounts)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    k = result["kpis"]
    print(f"Bookkeeping complete -> {OUTPUT_PATH}")
    print(f"  Period:        {result['period']['from']} -> {result['period']['to']}  "
          f"({result['period']['transactions']} txns)")
    print(f"  Cash on hand:  {k['current_cash']:,.2f}")
    print(f"  Net worth:     {k['net_worth']:,.2f}")
    print(f"  Avg net/mo:    {k['avg_monthly_net']:,.2f}"
          + (f"   Runway: {k['runway_months']} months" if k['runway_months'] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
