#!/usr/bin/env bash
# Render a URL headlessly and slice the result into readable strips.
#   shot.sh <url> <out-prefix> [width] [height]
# Emits /tmp/shots/<prefix>-1.png … as 1000px-wide slices.
set -euo pipefail

URL="$1"
OUT="${2:-shot}"
W="${3:-1440}"
H="${4:-5200}"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR=/tmp/shots
mkdir -p "$DIR"
rm -f "$DIR/$OUT"*.png

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --virtual-time-budget=8000 \
  --window-size="$W,$H" \
  --screenshot="$DIR/$OUT-full.png" "$URL" >/dev/null 2>&1

FW=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$DIR/$OUT-full.png")
FH=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$DIR/$OUT-full.png")

STRIP=1400
N=$(( (FH + STRIP - 1) / STRIP ))
for ((i=0; i<N; i++)); do
  TOP=$(( i * STRIP ))
  SH=$(( FH - TOP )); (( SH > STRIP )) && SH=$STRIP
  ffmpeg -v error -y -i "$DIR/$OUT-full.png" \
    -vf "crop=${FW}:${SH}:0:${TOP},scale=1000:-1" "$DIR/$OUT-$((i+1)).png"
done
echo "$N strips from ${FW}x${FH}"
