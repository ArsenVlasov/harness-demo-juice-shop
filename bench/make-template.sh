#!/usr/bin/env bash
# Makes the template of suite A or B for a test case set other than precise (plan v2, E2).
#
#   bench/make-template.sh A vague    makes RUNS/templates/suite-a-vague.git
#
# The template has the same history shape as RUNS/templates/suite-<a|b>-precise.git: the parent of the precise
# test case commit (A: the baseline commit, B: the harness-v1 commit), plus one commit that adds the lab copy of the
# set at its tag (bench/conditions.json, tcSets) as test-cases/. The tags are the tags of the precise template.
# The agent sees this history, so the commit message, the branch, the tags and the paths must not contain the word
# "vague" or the name of the set. The script refuses if the template exists.
# Env, for tests only: CL_LAB, CL_RUNS.
# Bash 3.2 (macOS /bin/bash) and later.
set -euo pipefail

usage() { echo "usage: $0 A|B <tcSet>" >&2; exit 2; }
die() { echo "error: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

SUITE_ID="${1:-}"; TCSET="${2:-}"
case "$SUITE_ID" in A) S=a; LAST_TAG=baseline ;; B) S=b; LAST_TAG=harness-v1 ;; *) usage ;; esac
[[ "$TCSET" =~ ^[A-Za-z0-9._-]+$ ]] || usage
[ "$TCSET" != precise ] || die "bench/migrate-layout.sh makes the precise templates"

LAB="$(cd "${CL_LAB:-$(dirname "$0")/..}" && pwd -P)"
RUNS="$(cd "${CL_RUNS:-$LAB/../harness-demo-runs}" && pwd -P)"
NODE="$HOME/.local/node-v24.21.0/bin/node"
FIELDS="$("$NODE" -e '
const t = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).tcSets[process.argv[2]];
if (!t) { console.error(`no tcSet "${process.argv[2]}" in bench/conditions.json`); process.exit(1) }
console.log(t.labDir, t.labTag)' "$LAB/bench/conditions.json" "$TCSET")" || die "bad tcSet: $TCSET"
read -r LAB_DIR LAB_TAG <<<"$FIELDS"
[[ "$LAB_DIR" =~ ^[A-Za-z0-9._-]+$ ]] && [[ "$LAB_TAG" =~ ^[A-Za-z0-9._-]+$ ]] || die "bad tcSet values: $FIELDS"
PRECISE="$RUNS/templates/suite-$S-precise.git"
TPL="$RUNS/templates/suite-$S-$TCSET.git"
SUBJECT="Add test cases TC-01 to TC-08 (test-cases-v2)"
FORBIDDEN="vague|$TCSET"   # case-insensitive, in names and messages of the template

tc_hash() { (cd "$1" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d' ' -f1); }

# --- checks before anything changes ---------------------------------------------------------
[ ! -e "$TPL" ] || die "$TPL exists"
[ -d "$PRECISE" ] || die "no $PRECISE. Run bench/migrate-layout.sh first"
git -C "$LAB" rev-parse -q --verify "refs/tags/$LAB_TAG^{commit}" >/dev/null || die "no tag $LAB_TAG in the lab"
[ -n "$(git -C "$LAB" ls-tree -d "$LAB_TAG" "$LAB_DIR")" ] || die "no folder $LAB_DIR at the lab tag $LAB_TAG"
PARENT="$(git -C "$PRECISE" rev-parse --verify 'main~1^{commit}')"
[ "$(git -C "$PRECISE" rev-parse "refs/tags/$LAST_TAG^{commit}")" = "$PARENT" ] || die "main~1 of $PRECISE is not the tag $LAST_TAG"
[ -z "$(git -C "$PRECISE" ls-tree "$PARENT" test-cases)" ] || die "the parent $PARENT has test-cases/"
PRECISE_TAGS="$(git -C "$PRECISE" for-each-ref --format='%(objectname) %(refname)' refs/tags)"
AUTHOR_NAME="$(git -C "$PRECISE" log -1 --format=%an main)"; AUTHOR_EMAIL="$(git -C "$PRECISE" log -1 --format=%ae main)"

TMP="$(mktemp -d "$(cd "${TMPDIR:-/tmp}" && pwd -P)/make-template.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
git -C "$LAB" archive "$LAB_TAG" "$LAB_DIR" | tar -x -C "$TMP"
LAB_SHA="$(tc_hash "$TMP/$LAB_DIR")"
if (cd "$TMP/$LAB_DIR" && find . | grep -Eiq "$FORBIDDEN"); then die "a file name in $LAB_TAG:$LAB_DIR has the word vague or $TCSET"; fi

# --- the commit in a temp clone, then a new bare repository -------------------------------------
git clone -q --no-local --no-hardlinks "$PRECISE" "$TMP/work"
git -C "$TMP/work" reset -q --hard "$PARENT"
mv "$TMP/$LAB_DIR" "$TMP/work/test-cases"
git -C "$TMP/work" add test-cases
GIT_AUTHOR_NAME="$AUTHOR_NAME" GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" GIT_COMMITTER_NAME="$AUTHOR_NAME" GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
  git -C "$TMP/work" commit -q --no-verify -m "$SUBJECT" \
  -m "A copy of the second test case set of the lab, at its freeze tag.
sha256 of the set: $LAB_SHA" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
NEW="$(git -C "$TMP/work" rev-parse HEAD)"
git init -q --bare "$TMP/tpl.git"
git -C "$TMP/tpl.git" symbolic-ref HEAD refs/heads/main
REFSPECS=("$NEW:refs/heads/main")
for t in $(git -C "$PRECISE" for-each-ref --format='%(refname)' refs/tags); do REFSPECS+=("$t:$t"); done
git -C "$TMP/work" push -q --no-verify "$TMP/tpl.git" "${REFSPECS[@]}"

# --- checks of the new template ----------------------------------------------------------------
T="$TMP/tpl.git"
[ "$(git -C "$T" for-each-ref --format='%(objectname) %(refname)' refs/tags)" = "$PRECISE_TAGS" ] || die "the tags are not the tags of $PRECISE"
[ "$(git -C "$T" for-each-ref --format='%(refname)' refs/heads)" = refs/heads/main ] || die "the template has other branches"
[ "$(git -C "$T" rev-parse 'main~1')" = "$PARENT" ] || die "main~1 is not $PARENT"
[ "$(git -C "$T" log --format=%s -1 main)" = "$SUBJECT" ] || die "the subject is not: $SUBJECT"
CHANGES="$(git -C "$T" diff --name-status "$PARENT" main)"
[ -z "$(echo "$CHANGES" | grep -v $'^A\ttest-cases/')" ] || die "the new commit changes more than test-cases/: $CHANGES"
TPL_SHA="$(mkdir "$TMP/check" && git -C "$T" archive main test-cases | tar -x -C "$TMP/check" && tc_hash "$TMP/check/test-cases")"
[ "$TPL_SHA" = "$LAB_SHA" ] || die "test-cases sha256 in the template ($TPL_SHA) is not the lab copy ($LAB_SHA)"
NAMES="$(git -C "$T" for-each-ref --format='%(refname) %(contents)'; git -C "$T" log --format='%B' main; git -C "$T" ls-tree -r --name-only main)"
! echo "$NAMES" | grep -Eiq "$FORBIDDEN" || die "the refs, messages or paths of the template have the word vague or $TCSET: $(echo "$NAMES" | grep -Ei "$FORBIDDEN" | head -3)"
CONTENT_HITS="$(git -C "$T" grep -Eil "$FORBIDDEN" main -- test-cases || true)"
FSCK="$(git -C "$T" fsck --no-dangling --no-progress 2>&1)" || die "git fsck fails in the new template: $FSCK"
mv "$T" "$TPL"

echo
echo "Report of bench/make-template.sh, $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "template: $TPL, HEAD $(git -C "$TPL" symbolic-ref HEAD)"
echo "main: $NEW, tree $(git -C "$TPL" rev-parse 'main^{tree}'), subject: $(git -C "$TPL" log -1 --format=%s main)"
echo "parent: $PARENT (tag $LAST_TAG, main~1 of the precise template)"
echo "tags: $(git -C "$TPL" for-each-ref --format='%(refname:short)=%(objectname:short)' refs/tags | tr '\n' ' ')(the same objects as the precise template)"
echo "test-cases sha256: $TPL_SHA, equals the lab copy $LAB_TAG:$LAB_DIR"
echo "names check: no match of /$FORBIDDEN/i in the refs, the messages and the paths"
if [ -n "$CONTENT_HITS" ]; then echo "WARNING: these files have the word vague or $TCSET in their text: $(echo "$CONTENT_HITS" | tr '\n' ' ')"; fi
