#!/usr/bin/env bash
# Moves the suites of run 1 into the run layout of plan v2 and makes the templates of the precise test case set.
#
#   bench/migrate-layout.sh
#
# 1. mv RUNS/suite-a and RUNS/suite-b into RUNS/<dir of precise>/run-1/. It refuses if a target exists, or if a suite
#    has changes in tracked files. A suite that is already at the target and not at the source stays there.
# 2. Makes RUNS/templates/suite-a-precise.git and suite-b-precise.git: bare repositories with the start state of
#    run 1 (gen-1~1) as branch main, HEAD on main, and the start tags (A: baseline; B: baseline, harness-v1).
#    It refuses if a template exists.
# 3. Checks each template: only these refs, the tree of main equals the tree of gen-1~1, no gen-1 objects.
# 4. Prints a report.
# Env, for tests only: CL_LAB, CL_RUNS.
# Bash 3.2 (macOS /bin/bash) and later.
set -euo pipefail

die() { echo "error: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

LAB="$(cd "${CL_LAB:-$(dirname "$0")/..}" && pwd -P)"
RUNS="$(cd "${CL_RUNS:-$LAB/../harness-demo-runs}" && pwd -P)"
NODE="$HOME/.local/node-v24.21.0/bin/node"
FIELDS="$("$NODE" -e '
const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).conditions.precise;
console.log(c.dir, c.tcSet)' "$LAB/bench/conditions.json")"
read -r PDIR TCSET <<<"$FIELDS"
[[ "$PDIR" =~ ^[A-Za-z0-9._-]+$ ]] && [[ "$TCSET" =~ ^[A-Za-z0-9._-]+$ ]] || die "bad precise condition in bench/conditions.json: $FIELDS"

# The facts of run 1, checked with git on 20.10: the start commit of each suite and its tags at the start of run 1.
expected_start() { case "$1" in a) echo 25a5dbfad88f4029ccf0a5aa3140c4cde6e28ee9 ;; b) echo 268e15c92998a28cd86f262b53f7e6094ef7f13a ;; esac; }
start_tags() { case "$1" in a) echo baseline ;; b) echo baseline harness-v1 ;; esac; }
tc_hash_at() { # sha256 of test-cases/ in commit $2 of repository $1, the method of the test-cases-v1 freeze
  local t; t="$(mktemp -d "$(cd "${TMPDIR:-/tmp}" && pwd -P)/migrate-layout.XXXXXX")"
  git -C "$1" archive "$2" test-cases | tar -x -C "$t"
  (cd "$t/test-cases" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d' ' -f1)
  rm -rf "$t"
}

# --- checks before anything changes ---------------------------------------------------------
for s in a b; do
  src="$RUNS/suite-$s"; dst="$RUNS/$PDIR/run-1/suite-$s"; tpl="$RUNS/templates/suite-$s-$TCSET.git"
  [ ! -e "$tpl" ] || die "$tpl exists"
  if [ -e "$src" ]; then
    [ ! -e "$dst" ] || die "$src and $dst both exist"
    suite="$src"
    [ -z "$(git -C "$suite" status --short --untracked-files=no)" ] || die "$suite has changes in tracked files"
  else
    [ -d "$dst" ] || die "no $src and no $dst"
    suite="$dst"
  fi
  start="$(git -C "$suite" rev-parse --verify 'gen-1~1^{commit}')" || die "no tag gen-1 in $suite"
  [ "$start" = "$(expected_start "$s")" ] || die "gen-1~1 of $suite is $start, not $(expected_start "$s")"
  for t in $(start_tags "$s"); do
    git -C "$suite" merge-base --is-ancestor "refs/tags/$t" "$start" || die "tag $t of $suite is not in the start state"
  done
done

# --- 1. move the suites ------------------------------------------------------------------------
mkdir -p "$RUNS/$PDIR/run-1" "$RUNS/templates"
for s in a b; do
  if [ -e "$RUNS/suite-$s" ]; then
    mv "$RUNS/suite-$s" "$RUNS/$PDIR/run-1/suite-$s"
    log "moved: RUNS/suite-$s -> RUNS/$PDIR/run-1/suite-$s"
  else
    log "in place: RUNS/$PDIR/run-1/suite-$s"
  fi
done

# --- 2 and 3. the templates and their checks -----------------------------------------------------
REPORT=()
for s in a b; do
  suite="$RUNS/$PDIR/run-1/suite-$s"; tpl="$RUNS/templates/suite-$s-$TCSET.git"; tmp="$tpl.tmp-$$"
  start="$(git -C "$suite" rev-parse 'gen-1~1^{commit}')"
  start_tree="$(git -C "$suite" rev-parse 'gen-1~1^{tree}')"
  gen_commit="$(git -C "$suite" rev-parse 'gen-1^{commit}')"
  gen_tag="$(git -C "$suite" rev-parse 'refs/tags/gen-1')"
  refspecs=("$start:refs/heads/main"); want="refs/heads/main"
  for t in $(start_tags "$s"); do refspecs+=("refs/tags/$t:refs/tags/$t"); want="$want
refs/tags/$t"; done
  trap 'rm -rf "$tmp"' EXIT
  git init -q --bare "$tmp"
  git -C "$tmp" symbolic-ref HEAD refs/heads/main
  git -C "$suite" push -q --no-verify "$tmp" "${refspecs[@]}"
  [ "$(git -C "$tmp" for-each-ref --format='%(refname)' | LC_ALL=C sort)" = "$(echo "$want" | LC_ALL=C sort)" ] || die "the refs of $tmp are not: $want"
  for t in $(start_tags "$s"); do
    [ "$(git -C "$tmp" rev-parse "refs/tags/$t")" = "$(git -C "$suite" rev-parse "refs/tags/$t")" ] || die "tag $t of $tmp is not tag $t of $suite"
  done
  [ "$(git -C "$tmp" rev-parse 'main^{commit}')" = "$start" ] || die "main of $tmp is not $start"
  [ "$(git -C "$tmp" rev-parse 'main^{tree}')" = "$start_tree" ] || die "the tree of main of $tmp is not the tree of gen-1~1"
  ! git -C "$tmp" cat-file -e "$gen_commit" 2>/dev/null || die "$tmp has the gen-1 commit $gen_commit"
  ! git -C "$tmp" cat-file -e "$gen_tag" 2>/dev/null || die "$tmp has the gen-1 tag object $gen_tag"
  fsck="$(git -C "$tmp" fsck --no-dangling --no-progress 2>&1)" || die "git fsck fails in $tmp: $fsck"
  mv "$tmp" "$tpl"
  trap - EXIT
  log "template: RUNS/templates/$(basename "$tpl")"
  REPORT+=("suite $s: run 1 at RUNS/$PDIR/run-1/suite-$s
  template RUNS/templates/$(basename "$tpl"), HEAD $(git -C "$tpl" symbolic-ref HEAD)
  main $start (gen-1~1 of run 1), tree $start_tree (equals the tree of gen-1~1)
  refs: $(git -C "$tpl" for-each-ref --format='%(refname:short)=%(objectname:short)' | tr '\n' ' ')
  gen-1 commit $gen_commit and tag object $gen_tag: absent (git cat-file -e fails)
  test-cases sha256 in main: $(tc_hash_at "$tpl" main)
  objects: $(git -C "$tpl" count-objects -v | grep -E '^(count|in-pack)' | tr '\n' ' ')")
done

echo
echo "Report of bench/migrate-layout.sh, $(date '+%Y-%m-%d %H:%M:%S %Z'), RUNS $RUNS"
for r in "${REPORT[@]}"; do echo "$r"; done
echo "RUNS now: $(cd "$RUNS" && ls | tr '\n' ' ')"
