#!/usr/bin/env bash
# Makes the work folder of the binder session (bench/hypotheses-v2.md, "Binding the rules to JSON fields", step 2).
#
#   bash bench/make-binder-folder.sh <work folder> <capture file>...
#   example: bash bench/make-binder-folder.sh ../harness-demo-runs/field-map capture-A.jsonl capture-B.jsonl
#
# The work folder must not exist. It must be a direct child of RUNS (harness-demo-runs), and its name must not hold
# the words vague, patch, mutant or sealed (letter case does not count): the session sees the path of its folder.
# Each capture file must be outside RUNS, with a name of letters, digits, '.', '_' or '-' and the extension .jsonl.
# Each capture file must be the output of bench/tag-capture.mjs (step 1): each line has the keys "tc" and "test".
# `check-tamper-rules.mjs --fields` must read each capture file with no K0 problem. Thus the script refuses a raw
# capture of the proxy, and a line with "changed": true.
# The script makes the folder with only these files:
#   test-cases/                 from `git -C <lab> archive test-cases-v1 test-cases`
#   binding-tables.md           the operator table, the table of candidate values and the table "The rules" of
#                               bench/hypotheses-v2.md, from `node bench/check-tamper-rules.mjs --tables`. Its first
#                               line gives the sha256 of the source file, but not its name: the name tells about the
#                               plan. The log line of the script gives the name and the sha256 for LOG.md.
#   <each capture file>         a copy with the same name
#   tamper-rules.example.json   a copy of bench/tamper-rules.example.json, for the format
# The table "Values with no rule" is not in binding-tables.md. The binder writes a reason only for a rule T01 to T16,
# and that reason is always "no JSON field". The values of that table have no rule, so the binder does not bind them.
# The table also names parts of the plan, and the binder must not see them.
# The script refuses when binding-tables.md holds a word of FORBIDDEN_TEXT (letter case does not count). When
# tamper-rules.example.json holds such a word, the script gives a warning and continues: the procedure copies that
# file with no change. Record the warning in LOG.md.
# At the end, it prints the sha256 of each file in the folder, the hash of test-cases/ and the hash of the folder,
# by the method of the test-cases-v1 freeze:
#   (cd <folder> && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256) | shasum -a 256
# Then the main session copies bench/check-tamper-rules.mjs into the folder as check-tamper-rules.mjs. The script
# does not copy it, but it prints its sha256. The check in the folder, and the binder runs of the check, are a change
# from steps 2 and 4 of the procedure. Record this change and the sha256 of the check in LOG.md before the run.
# The file has no execute bit. Run it with bash.
# Env, for tests only: CL_LAB, CL_RUNS.
# Bash 3.2 (macOS /bin/bash) and later.
set -euo pipefail

usage() { sed -n '4,5p' "$0" >&2; exit 2; }
die() { echo "error: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

[ $# -ge 2 ] || usage
WORK_ARG="$1"; shift
CAPTURES=("$@")

LAB="$(cd "${CL_LAB:-$(dirname "$0")/..}" && pwd -P)"
RUNS="$(cd "${CL_RUNS:-$LAB/../harness-demo-runs}" 2>/dev/null && pwd -P)" || die "no RUNS folder: ${CL_RUNS:-$LAB/../harness-demo-runs}"
NODE="$HOME/.local/node-v24.21.0/bin/node"
CHECK="$LAB/bench/check-tamper-rules.mjs"
HYP="$LAB/bench/hypotheses-v2.md"
EXAMPLE="$LAB/bench/tamper-rules.example.json"
TC_TAG="test-cases-v1"
FORBIDDEN_NAME='vague|patch|mutant|sealed'
FORBIDDEN_TEXT='vague|patch|mutant|sealed|harness|suite|bug|hypothes|pre-registration|experiment|audit|freeze|plan v2'
RESERVED="test-cases binding-tables.md tamper-rules.example.json tamper-rules.json check-tamper-rules.mjs"

# True when the name $1 holds a word of FORBIDDEN_NAME, in any letter case.
forbidden_name() { local lower; lower="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"; [[ $lower =~ $FORBIDDEN_NAME ]]; }
# True when path $1 is path $2 or a path below it.
inside() { case "$1/" in "$2"/*) return 0 ;; *) return 1 ;; esac; }
sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
file_hashes() { (cd "$1" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256); }

# --- checks before anything changes ---------------------------------------------------------
[ -x "$NODE" ] || die "no Node at $NODE"
for f in "$CHECK" "$HYP" "$EXAMPLE"; do [ -f "$f" ] || die "no $f"; done
git -C "$LAB" rev-parse -q --verify "refs/tags/$TC_TAG^{commit}" >/dev/null || die "no tag $TC_TAG in the lab"
PARENT="$(cd "$(dirname "$WORK_ARG")" 2>/dev/null && pwd -P)" || die "the parent folder of $WORK_ARG does not exist"
NAME="$(basename "$WORK_ARG")"
WORK="$PARENT/$NAME"
[ "$PARENT" = "$RUNS" ] || die "the work folder must be a direct child of RUNS ($RUNS), not $WORK"
[[ "$NAME" =~ ^[A-Za-z0-9._-]+$ ]] && [ "$NAME" != . ] && [ "$NAME" != .. ] || die "bad folder name: $NAME"
if forbidden_name "$NAME"; then die "the folder name $NAME holds one of the words: ${FORBIDDEN_NAME//|/, }"; fi
[ ! -e "$WORK" ] && [ ! -L "$WORK" ] || die "$WORK exists"

NAMES=""
for c in "${CAPTURES[@]}"; do
  [ -f "$c" ] && [ -r "$c" ] || die "no capture file $c"
  CREAL="$(cd "$(dirname "$c")" && pwd -P)/$(basename "$c")"
  ! inside "$CREAL" "$RUNS" || die "the capture file $c is inside RUNS. Keep the capture files outside RUNS"
  CNAME="$(basename "$c")"
  [[ "$CNAME" =~ ^[A-Za-z0-9._-]+\.jsonl$ ]] || die "bad capture file name: $CNAME (letters, digits, '.', '_', '-' and .jsonl)"
  if forbidden_name "$CNAME"; then die "the capture file name $CNAME holds one of the words: ${FORBIDDEN_NAME//|/, }"; fi
  for r in $RESERVED; do [ "$CNAME" != "$r" ] || die "the capture file name $CNAME is reserved"; done
  case " $NAMES " in *" $CNAME "*) die "two capture files have the name $CNAME" ;; esac
  NAMES="$NAMES $CNAME"
done

TMP="$(mktemp -d "$(cd "${TMPDIR:-/tmp}" && pwd -P)/make-binder-folder.XXXXXX")"
MADE=0
cleanup() { rm -rf "$TMP"; if [ "$MADE" = 1 ]; then rm -rf "$WORK"; fi; }
trap cleanup EXIT

# --- the files, first in a temp folder -----------------------------------------------------------
STAGE="$TMP/stage"
mkdir "$STAGE"
git -C "$LAB" archive "$TC_TAG" test-cases | tar -x -C "$STAGE"
[ -d "$STAGE/test-cases" ] || die "no folder test-cases at the tag $TC_TAG"
# One read of the source: the sha256 in the first line is the hash of the bytes that the tables come from.
cp "$HYP" "$TMP/source.md"
HYP_SHA="$(sha "$TMP/source.md")"
"$NODE" "$CHECK" --tables "$TMP/source.md" >"$STAGE/binding-tables.md"
[ "$(head -1 "$STAGE/binding-tables.md")" = "These tables are copies from a source file, sha256 $HYP_SHA, with no change." ] \
  || die "the first line of binding-tables.md does not give the sha256 $HYP_SHA"
if grep -Eino "$FORBIDDEN_TEXT" "$STAGE/binding-tables.md" >"$TMP/words.txt"; then
  die "binding-tables.md holds a word that the binder must not see: $(tr '\n' ' ' <"$TMP/words.txt")"
fi
for c in "${CAPTURES[@]}"; do cp "$c" "$STAGE/$(basename "$c")"; done
CAPTURE_COPIES=()
for c in "${CAPTURES[@]}"; do CAPTURE_COPIES+=("$STAGE/$(basename "$c")"); done
"$NODE" "$CHECK" --fields "${CAPTURE_COPIES[@]}" >"$TMP/fields.txt" || die "a capture file has a K0 problem: $(grep '^K0' "$TMP/fields.txt" | head -3 | tr '\n' ' ')"
cp "$EXAMPLE" "$STAGE/tamper-rules.example.json"
EXAMPLE_WORDS=""
if grep -Eino "$FORBIDDEN_TEXT" "$STAGE/tamper-rules.example.json" >"$TMP/example-words.txt"; then
  EXAMPLE_WORDS="$(tr '\n' ' ' <"$TMP/example-words.txt")"
fi

# Only the listed files: the files of test-cases/ at the tag, binding-tables.md, the captures and the example.
EXPECTED="$( { git -C "$LAB" ls-tree -r --name-only "$TC_TAG" test-cases; echo binding-tables.md; echo tamper-rules.example.json
  for n in $NAMES; do echo "$n"; done; } | LC_ALL=C sort)"
FOUND="$(cd "$STAGE" && find . -type f | sed 's|^\./||' | LC_ALL=C sort)"
[ "$FOUND" = "$EXPECTED" ] || die "the files are not the listed files. Found: $(echo "$FOUND" | tr '\n' ' ')"
[ -z "$(cd "$STAGE" && find . ! -type f ! -type d)" ] || die "the folder holds an item that is not a file or a folder"

# --- the work folder -----------------------------------------------------------------------------
mkdir "$WORK"
MADE=1
cp -R "$STAGE/." "$WORK/"
[ "$(file_hashes "$WORK")" = "$(file_hashes "$STAGE")" ] || die "the copy in $WORK is not the same as the temp copy"
MADE=0

log "made $WORK: test-cases/ from $TC_TAG, binding-tables.md from bench/hypotheses-v2.md (sha256 $HYP_SHA), capture files:$NAMES, tamper-rules.example.json"
if [ -n "$EXAMPLE_WORDS" ]; then
  echo "warning: tamper-rules.example.json holds a word that tells about the plan: $EXAMPLE_WORDS(line:word). The procedure copies the file with no change. Record this in LOG.md." >&2
fi
file_hashes "$WORK"
echo "folder test-cases/: $(file_hashes "$WORK/test-cases" | shasum -a 256 | cut -d' ' -f1)"
echo "folder $NAME/: $(file_hashes "$WORK" | shasum -a 256 | cut -d' ' -f1)"
echo "next: copy bench/check-tamper-rules.mjs (sha256 $(sha "$CHECK")) into the folder as check-tamper-rules.mjs. Record in LOG.md its sha256 and the change from steps 2 and 4: the folder holds the check, and the binder runs it."
