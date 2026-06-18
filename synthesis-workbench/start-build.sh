#!/usr/bin/env bash
#
# start-build.sh — Synthesis Workbench build bootstrapper
#
# What it does (it does NOT write the app itself — Claude Code does that):
#   1. Fetches the spec (synthesis-workbench/ + research-workspace/knowledge) from the
#      branch into a local folder.
#   2. Writes a KICKOFF.txt with the exact prompt to start the build.
#   3. If the Claude Code CLI is installed, offers to launch it with that prompt.
#
# Usage:
#   bash start-build.sh                 # fetch into ./synthesis-build
#   bash start-build.sh /path/to/dest   # fetch into a folder you choose
#
# Run it from inside your PhD-workspace project so the build lands next to your app.
# Env overrides: SPEC_REPO_URL, SPEC_BRANCH.

set -euo pipefail

REPO_URL="${SPEC_REPO_URL:-https://github.com/Agazi-Joel/naday-website.git}"
BRANCH="${SPEC_BRANCH:-claude/academic-research-workspace-8dmuku}"
DEST="${1:-./synthesis-build}"

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is not installed."

say "Synthesis Workbench — fetching the build spec"
say "repo:   $REPO_URL"
say "branch: $BRANCH"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$tmp/repo" >/dev/null 2>&1 \
  || die "Could not clone $REPO_URL ($BRANCH). Check access/credentials, or set SPEC_REPO_URL/SPEC_BRANCH."

[ -d "$tmp/repo/synthesis-workbench" ] || die "synthesis-workbench/ not found on that branch."

mkdir -p "$DEST"
# Copy spec + the discipline knowledge it relies on, keeping them as siblings
cp -R "$tmp/repo/synthesis-workbench" "$DEST/"
mkdir -p "$DEST/research-workspace"
[ -d "$tmp/repo/research-workspace/knowledge" ] \
  && cp -R "$tmp/repo/research-workspace/knowledge" "$DEST/research-workspace/" \
  || say "(no research-workspace/knowledge on branch — Claude Code will reuse your existing workspace knowledge)"

say "Spec copied to: $DEST"
ls -1 "$DEST/synthesis-workbench"

# The exact kickoff prompt (kept in sync with BUILD.md §8)
cat > "$DEST/KICKOFF.txt" <<'EOF'
Read synthesis-workbench/BUILD.md, synthesis-workbench/SPEC.md, and synthesis-workbench/DECISIONS.md,
and skim research-workspace/knowledge/. Then execute Phase 0: obey my global CLAUDE.md;
ensure the front-end skill and the superpowers skill are installed (install if missing per
BUILD.md section 0b); and review my existing PhD-workspace skills (especially output /
processing / paper-extraction), past build-session notes, and the Zotero + supervisor
implementations. Produce the Reuse & Lessons Brief and the Slice 0 plan, then STOP at Gate A
for my confirmation.

After I confirm, build the Synthesis Workbench strictly in VERTICAL SLICES (BUILD.md section 6),
testing each slice before the next, reusing my Zotero ingestion and supervisor, and stopping at
each gate. Keep the thinking and writing mine — the supervisor tests and structures, it never
ghostwrites or confabulates.
EOF

say "Kickoff prompt written to: $DEST/KICKOFF.txt"
echo
echo "------------------------------------------------------------------"
cat "$DEST/KICKOFF.txt"
echo "------------------------------------------------------------------"
echo

if command -v claude >/dev/null 2>&1; then
  printf 'Launch Claude Code now with this kickoff? [y/N] '
  read -r ans || ans=""
  case "$ans" in
    [Yy]*)
      say "Launching Claude Code in $DEST …"
      ( cd "$DEST" && claude "$(cat "$DEST/KICKOFF.txt")" )
      ;;
    *)
      say "Skipped. To start later:  cd $DEST && claude  (then paste KICKOFF.txt)"
      ;;
  esac
else
  say "Claude Code CLI not found."
  echo "    Install it, then run:   cd $DEST && claude"
  echo "    and paste the contents of KICKOFF.txt as your first message."
fi
