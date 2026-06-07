# Bank statement formats — quick reference

`normalize.py` auto-detects columns, but banks vary. This is what it looks for
and how to handle the awkward cases.

## What the ingestor needs
Every statement must yield three things:
- **Date** — any common format (`2026-01-31`, `01/31/2026`, `31/01/2026`,
  `31-Jan-2026`, `Jan 31, 2026`, …). All normalized to `YYYY-MM-DD`.
- **Description** — merchant / payee / memo / narrative.
- **Amount** — either one signed column, **or** separate Debit and Credit columns.

Optional:
- **Balance** — a running balance column. If present, the bookkeeper trusts it for
  the account's ending balance (more reliable than summing flows).

## Column name synonyms it already understands
- date: posting/posted/transaction/trans/value date, date
- description: description, narrative, details, memo, payee, name, merchant,
  particulars, transaction, desc
- amount: amount, transaction amount, amt
- debit (money out): debit, withdrawal(s), money out, paid out, outflow, dr
- credit (money in): credit, deposit(s), money in, paid in, inflow, cr
- balance: running balance, ledger balance, balance

If your bank uses a name not in this list, add it to the `SYN` dict in
`normalize.py` and re-run.

## Sign convention
Normalized amounts: **positive = money in, negative = money out.**
- Single signed amount column → used as-is.
- Debit/Credit columns → `amount = credit − |debit|`.
- If your bank lists spending as positive in a plain "Amount" column, re-run that
  file with `--flip-sign`.

## Common quirks & fixes
| Symptom | Fix |
|---|---|
| File skipped: "could not find date/description/amount" | Open it; the header row may be below preamble lines (the script scans the first 15 rows) or a column name is unknown — add the synonym to `SYN`. |
| Income and expenses swapped | `--flip-sign` on that file. |
| Two files are really the same account | `--account "Name"` to unify. |
| Accounting negatives like `(123.45)` | Handled automatically. |
| Trailing-minus `123.45-` | Handled automatically. |
| `$`, `£`, `€`, thousands commas | Stripped automatically. |
| Excel `.xlsx` | "Save As CSV" first (keeps the toolchain dependency-free). |
| Semicolon/tab delimited | Auto-sniffed. |

## De-duplication
Re-importing the same file is safe. Rows are keyed on
`date + account + description + amount`; duplicates are skipped. Overlapping
statement periods won't double-count.
