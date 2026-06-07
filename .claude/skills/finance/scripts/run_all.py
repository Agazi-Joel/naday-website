#!/usr/bin/env python3
"""
run_all.py — the whole finance pipeline in one shot.

  normalize  ->  bookkeep  ->  dashboard

Drop your bank CSV exports in finance-data/raw/, then run:

  python3 .claude/skills/finance/scripts/run_all.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import normalize    # noqa: E402
import bookkeep     # noqa: E402
import dashboard    # noqa: E402


def main():
    print("=" * 60, "\n[1/3] Normalizing statements", "\n" + "=" * 60)
    rc = normalize.main([a for a in sys.argv[1:]])
    if rc:
        return rc
    print("\n" + "=" * 60, "\n[2/3] Bookkeeping", "\n" + "=" * 60)
    rc = bookkeep.main()
    if rc:
        return rc
    print("\n" + "=" * 60, "\n[3/3] Building dashboard", "\n" + "=" * 60)
    return dashboard.main()


if __name__ == "__main__":
    sys.exit(main())
