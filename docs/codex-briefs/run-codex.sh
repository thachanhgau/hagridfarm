#!/usr/bin/env bash
# Run one Codex brief from this repo. When the ChatGPT plan's usage limit stops it, sleep until the
# limit resets (rate_limits in the newest ~/.codex/sessions/**.jsonl, else the "try again at" time,
# else 30 min) and run the same brief again.
# Codex only draws (masters, 6-item sheets per the art bible); importing, code and checks stay with Claude.
# Usage: docs/codex-briefs/run-codex.sh <brief.md | "prompt"> [last.md] [tries=4]
# Env: CODEX_EFFORT (medium), CODEX_BIN, CODEX_HOME (~/.codex), CODEX_LIMIT_SLACK (60 s after the reset).
# Run it in the background: a limit wait can last hours.
set -uo pipefail
CODEX=${CODEX_BIN:-/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex}
REPO=$(cd "$(dirname "$0")/../.." && pwd)
[ $# -ge 1 ] || { sed -n 2,8p "$0"; exit 64; }
if [ -f "$1" ]; then prompt=$(cat "$1"); else prompt=$1; fi
last=${2:-$REPO/docs/codex-briefs/last.md}; tries=${3:-4}; log=${last%.md}.log
slack=${CODEX_LIMIT_SLACK:-60}; sessions=${CODEX_HOME:-$HOME/.codex}/sessions

# Seconds from now until the limit resets, from the newest session log; empty when unknown.
reset_wait() {
  node -e '
const fs=require("fs"),path=require("path");const walk=d=>{try{return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith(".jsonl")?[path.join(d,e.name)]:[])}catch{return[]}};
const file=walk(process.argv[1]).map(f=>[fs.statSync(f).mtimeMs,f]).sort((a,b)=>b[0]-a[0])[0]?.[1];if(!file)process.exit();
const lines=fs.readFileSync(file,"utf8").trim().split("\n").reverse(),now=Date.now()/1000;
for(const l of lines){const m=l.includes("\"rate_limits\"")&&JSON.parse(l);const r=m&&(m.payload?.rate_limits??m.rate_limits??m.payload?.info?.rate_limits);if(!r)continue;
 const w=[r.primary,r.secondary].filter(x=>x?.resets_at>now),full=w.filter(x=>x.used_percent>=100),pick=(full.length?full:w).map(x=>x.resets_at);
 if(pick.length)console.log(Math.ceil(Math.max(...pick)-now));process.exit();}' "$sessions" 2>/dev/null
}
# "try again at 3:42 PM" (today, or tomorrow if already past) → seconds; empty when absent.
message_wait() {
  local at; at=$(grep -oE 'try again at [0-9]{1,2}:[0-9]{2} ?[AP]M' "$log" | tail -1 | grep -oE '[0-9]{1,2}:[0-9]{2} ?[AP]M' | tr -d ' ')
  [ -n "$at" ] || return 0
  local target; target=$(date -j -f '%Y-%m-%d %I:%M%p' "$(date +%Y-%m-%d) $at" +%s 2>/dev/null) || return 0
  [ "$target" -gt "$(date +%s)" ] || target=$((target + 86400))
  echo $((target - $(date +%s)))
}

for ((try = 1; try <= tries; try++)); do
  "$CODEX" exec -C "$REPO" -s workspace-write --skip-git-repo-check -c "model_reasoning_effort=${CODEX_EFFORT:-medium}" -o "$last" "$prompt" < /dev/null 2>&1 | tee "$log"
  status=${PIPESTATUS[0]}
  # The brief text itself may mention the limit, so only a failed run with Codex's own wording counts.
  if [ "$status" -eq 0 ] || ! grep -qiE "(hit|reached) your usage limit" "$log"; then exit "$status"; fi
  wait=$(reset_wait); [ -n "$wait" ] || wait=$(message_wait); [ -n "$wait" ] || wait=1800
  echo "run-codex: usage limit (try $try/$tries); waiting $((wait + slack)) s until $(date -r $(($(date +%s) + wait + slack)) '+%d/%m %H:%M')" >&2
  [ "$try" -lt "$tries" ] && sleep $((wait + slack))
done
echo "run-codex: still limited after $tries tries" >&2; exit 75
