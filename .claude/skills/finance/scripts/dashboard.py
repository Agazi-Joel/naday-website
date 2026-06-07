#!/usr/bin/env python3
"""
dashboard.py — render finances.json into a single self-contained HTML file.

Pure standard library. No CDN, no JS framework: every chart is server-side
SVG, so the file works fully offline and can be opened straight from disk.
Styled in the Naday palette (cream / ink / electric purple).

Output: finance-data/output/dashboard.html
"""

import json
import os
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(HERE)
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))
DATA_DIR = os.environ.get("FINANCE_DATA_DIR", os.path.join(REPO_ROOT, "finance-data"))
OUTPUT_DIR = os.path.join(DATA_DIR, "output")
INPUT_PATH = os.path.join(OUTPUT_DIR, "finances.json")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "dashboard.html")

INK = "#0A0A0A"
MUTED = "#6b6862"
PURPLE = "#5B3FE6"
PURPLE_SOFT = "#7B5CE6"
GREEN = "#1f9d6b"
RED = "#d4503e"
RULE = "rgba(10,10,10,.12)"


def fmt(n, dp=0):
    if n is None:
        return "—"
    return f"{n:,.{dp}f}"


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


# --------------------------------------------------------------------------- #
#  SVG chart helpers
# --------------------------------------------------------------------------- #
def line_chart(series, key, width=720, height=240, pad=36, color=PURPLE,
               forecast=None):
    """Line chart of [{month, <key>}]. Optional dashed forecast continuation."""
    pts = series + (forecast or [])
    if not pts:
        return "<p class='empty'>No data yet.</p>"
    vals = [p[key] for p in pts]
    lo, hi = min(vals + [0]), max(vals + [0])
    rng = (hi - lo) or 1
    n = len(pts)

    def x(i):
        return pad + (i * (width - 2 * pad) / max(n - 1, 1))

    def y(v):
        return height - pad - ((v - lo) / rng) * (height - 2 * pad)

    # zero baseline
    y0 = y(0)
    parts = [f'<svg viewBox="0 0 {width} {height}" class="chart" '
             f'preserveAspectRatio="xMidYMid meet">']
    parts.append(f'<line x1="{pad}" y1="{y0:.1f}" x2="{width-pad}" y2="{y0:.1f}" '
                 f'stroke="{RULE}" stroke-width="1"/>')

    n_real = len(series)
    real = " ".join(f"{x(i):.1f},{y(series[i][key]):.1f}" for i in range(n_real))
    if n_real > 1:
        # area fill under the real line
        area = f"{x(0):.1f},{y0:.1f} " + real + f" {x(n_real-1):.1f},{y0:.1f}"
        parts.append(f'<polygon points="{area}" fill="{color}" opacity="0.08"/>')
        parts.append(f'<polyline points="{real}" fill="none" stroke="{color}" '
                     f'stroke-width="2.5" stroke-linejoin="round"/>')
    if forecast:
        fpts = " ".join(f"{x(n_real-1+i):.1f},{y(p[key]):.1f}"
                        for i, p in enumerate([series[-1]] + forecast))
        parts.append(f'<polyline points="{fpts}" fill="none" stroke="{MUTED}" '
                     f'stroke-width="2" stroke-dasharray="5 4"/>')
    for i, p in enumerate(pts):
        c = color if i < n_real else MUTED
        parts.append(f'<circle cx="{x(i):.1f}" cy="{y(p[key]):.1f}" r="3" fill="{c}"/>')
    # x labels (thin them out if many)
    step = max(1, n // 12)
    for i in range(0, n, step):
        parts.append(f'<text x="{x(i):.1f}" y="{height-8}" text-anchor="middle" '
                     f'class="axis">{esc(pts[i]["month"][2:])}</text>')
    parts.append(f'<text x="{pad}" y="14" class="axis">{fmt(hi)}</text>')
    parts.append("</svg>")
    return "".join(parts)


def grouped_bars(months, width=720, height=240, pad=36):
    """Income (green) vs Expense (red) grouped bars per month."""
    if not months:
        return "<p class='empty'>No data yet.</p>"
    hi = max([m["income"] for m in months] + [m["expense"] for m in months] + [1])
    n = len(months)
    slot = (width - 2 * pad) / n
    bw = min(slot * 0.34, 22)
    base = height - pad
    parts = [f'<svg viewBox="0 0 {width} {height}" class="chart" '
             f'preserveAspectRatio="xMidYMid meet">']
    parts.append(f'<line x1="{pad}" y1="{base}" x2="{width-pad}" y2="{base}" '
                 f'stroke="{RULE}"/>')

    def h(v):
        return (v / hi) * (height - 2 * pad)

    for i, m in enumerate(months):
        cx = pad + slot * i + slot / 2
        ih, eh = h(m["income"]), h(m["expense"])
        parts.append(f'<rect x="{cx-bw-1:.1f}" y="{base-ih:.1f}" width="{bw:.1f}" '
                     f'height="{ih:.1f}" rx="2" fill="{GREEN}"/>')
        parts.append(f'<rect x="{cx+1:.1f}" y="{base-eh:.1f}" width="{bw:.1f}" '
                     f'height="{eh:.1f}" rx="2" fill="{RED}"/>')
    step = max(1, n // 12)
    for i in range(0, n, step):
        cx = pad + slot * i + slot / 2
        parts.append(f'<text x="{cx:.1f}" y="{height-8}" text-anchor="middle" '
                     f'class="axis">{esc(months[i]["month"][2:])}</text>')
    parts.append(f'<text x="{pad}" y="14" class="axis">{fmt(hi)}</text>')
    parts.append("</svg>")
    return "".join(parts)


def hbars(items, key="amount", label="category", limit=10):
    items = items[:limit]
    if not items:
        return "<p class='empty'>No data yet.</p>"
    hi = max(i[key] for i in items) or 1
    rows = []
    for it in items:
        pct = 100 * it[key] / hi
        rows.append(
            f'<div class="hbar-row">'
            f'<div class="hbar-label">{esc(it[label])}</div>'
            f'<div class="hbar-track"><div class="hbar-fill" '
            f'style="width:{pct:.1f}%"></div></div>'
            f'<div class="hbar-val">{fmt(it[key])}</div></div>')
    return "".join(rows)


# --------------------------------------------------------------------------- #
#  Page
# --------------------------------------------------------------------------- #
def render(d):
    k = d["kpis"]
    bs = d["balance_sheet"]
    net_class = "pos" if k["net"] >= 0 else "neg"

    def kpi(label, value, sub="", cls=""):
        return (f'<div class="kpi"><div class="kpi-label">{esc(label)}</div>'
                f'<div class="kpi-value {cls}">{value}</div>'
                f'<div class="kpi-sub">{esc(sub)}</div></div>')

    runway = (f'{k["runway_months"]} mo' if k["runway_months"]
              else "Cash-flow positive")
    kpis_html = "".join([
        kpi("Cash on hand", f'${fmt(k["current_cash"])}'),
        kpi("Net worth", f'${fmt(k["net_worth"])}',
            f'assets − liabilities'),
        kpi("Net (period)", f'${fmt(k["net"])}', "income − expenses",
            "pos" if k["net"] >= 0 else "neg"),
        kpi("Avg net / month", f'${fmt(k["avg_monthly_net"])}',
            f'over {k["months_covered"]} mo',
            "pos" if k["avg_monthly_net"] >= 0 else "neg"),
        kpi("Runway", runway,
            "at current burn" if k["runway_months"] else ""),
        kpi("Savings rate",
            f'{fmt(k["savings_rate"],1)}%' if k["savings_rate"] is not None else "—"),
    ])

    bs_rows = ""
    for a in bs["assets"]:
        bs_rows += (f'<tr><td>{esc(a["label"])}</td><td class="num">'
                    f'${fmt(a["balance"],2)}</td></tr>')
    bs_rows += (f'<tr class="subtotal"><td>Total assets</td><td class="num">'
                f'${fmt(bs["total_assets"],2)}</td></tr>')
    for l in bs["liabilities"]:
        bs_rows += (f'<tr><td>{esc(l["label"])}</td><td class="num neg">'
                    f'(${fmt(l["balance"],2)})</td></tr>')
    bs_rows += (f'<tr class="subtotal"><td>Total liabilities</td><td class="num neg">'
                f'(${fmt(bs["total_liabilities"],2)})</td></tr>')
    bs_rows += (f'<tr class="total"><td>Equity / net worth</td><td class="num">'
                f'${fmt(bs["equity"],2)}</td></tr>')

    recent_rows = ""
    for r in d["recent"]:
        cls = "pos" if r["amount"] >= 0 else "neg"
        amt = f'${fmt(r["amount"],2)}' if r["amount"] >= 0 else f'(${fmt(-r["amount"],2)})'
        recent_rows += (f'<tr><td class="mono">{esc(r["date"])}</td>'
                        f'<td>{esc(r["description"])}</td>'
                        f'<td class="tag">{esc(r["category"])}</td>'
                        f'<td class="num {cls}">{amt}</td></tr>')

    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Naday Finance Dashboard</title>
<style>
  :root{{--cream:#F5F1EA;--cream2:#EFEAE0;--ink:{INK};--muted:{MUTED};
    --purple:{PURPLE};--green:{GREEN};--red:{RED};--rule:{RULE};}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:var(--cream);color:var(--ink);
    font-family:'Instrument Sans',system-ui,-apple-system,sans-serif;line-height:1.5}}
  .wrap{{max-width:1180px;margin:0 auto;padding:40px 24px 80px}}
  header{{display:flex;justify-content:space-between;align-items:flex-end;
    border-bottom:2px solid var(--ink);padding-bottom:18px;margin-bottom:28px}}
  h1{{font-size:30px;margin:0;letter-spacing:-.02em}}
  h1 .dot{{color:var(--purple)}}
  .meta{{color:var(--muted);font-size:13px;text-align:right}}
  h2{{font-size:13px;text-transform:uppercase;letter-spacing:.12em;
    color:var(--muted);margin:36px 0 14px;font-weight:600}}
  .kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px}}
  .kpi{{background:#fff;border:1px solid var(--rule);border-radius:14px;padding:16px 18px}}
  .kpi-label{{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}}
  .kpi-value{{font-size:26px;font-weight:600;letter-spacing:-.01em;margin-top:4px}}
  .kpi-sub{{font-size:12px;color:var(--muted);margin-top:2px;min-height:14px}}
  .pos{{color:var(--green)}} .neg{{color:var(--red)}}
  .grid2{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}
  @media(max-width:820px){{.grid2{{grid-template-columns:1fr}}}}
  .card{{background:#fff;border:1px solid var(--rule);border-radius:14px;padding:20px}}
  .card h3{{margin:0 0 12px;font-size:15px}}
  .chart{{width:100%;height:auto}}
  .axis{{font-size:10px;fill:var(--muted)}}
  .legend{{display:flex;gap:16px;font-size:12px;color:var(--muted);margin-top:6px}}
  .legend i{{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:middle}}
  table{{width:100%;border-collapse:collapse;font-size:14px}}
  th,td{{text-align:left;padding:8px 6px;border-bottom:1px solid var(--rule)}}
  th{{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}}
  td.num{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
  .mono{{font-variant-numeric:tabular-nums;color:var(--muted);white-space:nowrap}}
  tr.subtotal td{{font-weight:600;border-top:1px solid var(--ink)}}
  tr.total td{{font-weight:700;font-size:15px;border-top:2px solid var(--ink);border-bottom:none}}
  .tag{{font-size:12px;color:var(--purple)}}
  .hbar-row{{display:grid;grid-template-columns:130px 1fr 80px;gap:10px;align-items:center;margin-bottom:9px;font-size:13px}}
  .hbar-label{{color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
  .hbar-track{{background:var(--cream2);border-radius:6px;height:14px;overflow:hidden}}
  .hbar-fill{{background:var(--purple);height:100%;border-radius:6px}}
  .hbar-val{{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted)}}
  .empty{{color:var(--muted);font-size:13px}}
  .note{{font-size:12px;color:var(--muted);margin-top:10px}}
  footer{{margin-top:48px;color:var(--muted);font-size:12px;text-align:center}}
</style></head>
<body><div class="wrap">
  <header>
    <h1>Naday Finance<span class="dot">.</span></h1>
    <div class="meta">
      {esc(d["period"]["from"])} → {esc(d["period"]["to"])} · {d["period"]["transactions"]} transactions<br>
      Generated {esc(d["generated_at"])}
    </div>
  </header>

  <h2>At a glance</h2>
  <div class="kpis">{kpis_html}</div>

  <h2>Trends</h2>
  <div class="grid2">
    <div class="card">
      <h3>Cash position over time</h3>
      {line_chart(d["cash_series"], "cash", forecast=d.get("forecast"))}
      <div class="legend"><span><i style="background:{PURPLE}"></i>Actual</span>
        <span><i style="background:{MUTED}"></i>6-mo forecast</span></div>
    </div>
    <div class="card">
      <h3>Monthly income vs expense</h3>
      {grouped_bars(d["pnl"]["months"])}
      <div class="legend"><span><i style="background:{GREEN}"></i>Income</span>
        <span><i style="background:{RED}"></i>Expense</span></div>
    </div>
  </div>

  <h2>Where the money goes</h2>
  <div class="grid2">
    <div class="card"><h3>Top expense categories</h3>
      {hbars(d["by_category"]["expense"])}</div>
    <div class="card"><h3>Income sources</h3>
      {hbars(d["by_category"]["income"])}</div>
  </div>

  <h2>Balance sheet &amp; activity</h2>
  <div class="grid2">
    <div class="card"><h3>Balance sheet</h3>
      <table><tbody>{bs_rows}</tbody></table>
      <p class="note">Cash balances are derived from your statements; opening
      balances and liabilities come from finance-data/accounts.json.</p>
    </div>
    <div class="card"><h3>Recent transactions</h3>
      <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th></tr></thead>
      <tbody>{recent_rows}</tbody></table>
    </div>
  </div>

  <footer>Naday Finance · generated locally · figures are for planning, not filing.
  Always reconcile against source statements before making decisions.</footer>
</div></body></html>"""


def main():
    if not os.path.exists(INPUT_PATH):
        print(f"No {INPUT_PATH}. Run bookkeep.py first.")
        return 1
    with open(INPUT_PATH, encoding="utf-8") as f:
        d = json.load(f)
    html = render(d)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Dashboard written -> {OUTPUT_PATH}")
    print("Open it in a browser:  file://" + OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
