#!/bin/sh

set -eu

output_dir=${MEETWELL_OUTPUT_DIR:-bin}
targets=${MEETWELL_TARGETS:-"linux/amd64 linux/arm64 darwin/amd64 darwin/arm64 windows/amd64 windows/arm64"}

mkdir -p "$output_dir"

for target in $targets; do
	target_os=${target%/*}
	target_arch=${target#*/}
	suffix=
	if [ "$target_os" = "windows" ]; then
		suffix=.exe
	fi

	output="$output_dir/meetwell-${target_os}-${target_arch}${suffix}"
	CGO_ENABLED=0 GOOS="$target_os" GOARCH="$target_arch" \
		go build -trimpath -ldflags="-s -w" -o "$output" .
	printf 'Built %s\n' "$output"
done
