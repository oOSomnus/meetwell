#!/bin/sh

set -eu

output_dir=${MEETWELL_OUTPUT_DIR:-bin}
target_os=${GOOS:-$(go env GOOS)}
target_arch=${GOARCH:-$(go env GOARCH)}
suffix=

if [ "$target_os" = "windows" ]; then
	suffix=.exe
fi

mkdir -p "$output_dir"
output="$output_dir/meetwell-${target_os}-${target_arch}${suffix}"

CGO_ENABLED=0 GOOS="$target_os" GOARCH="$target_arch" \
	go build -trimpath -ldflags="-s -w" -o "$output" .

printf 'Built %s\n' "$output"
