# Meetwell · Meeting Scheduler

A visual meeting-time planner built with React, Vite, and TypeScript.

## Development

Install the dependencies and start the local development server:

```bash
npm install
make dev
```

To start the packaged application locally, build and run its standalone binary:

```bash
make run
```

Use `ADDR` to select a specific address or port:

```bash
make run ADDR=127.0.0.1:8080
```

## Verification

Run the test suite and production build:

```bash
make test
make build
```

## Standalone binary

Build the frontend and package it into a self-contained Go binary:

```bash
make package
./bin/meetwell-$(go env GOOS)-$(go env GOARCH)
```

The binary starts a local HTTP server on a random loopback port, prints the URL, and opens it in the default browser. Node.js and the frontend source are not needed after the binary has been built. Use `--addr` to select a specific address or port:

```bash
make run ADDR=127.0.0.1:8080
```

Cross-compile one target by setting `GOOS` and `GOARCH`:

```bash
make package GOOS=linux GOARCH=amd64
make package GOOS=darwin GOARCH=arm64
make package GOOS=windows GOARCH=amd64
```

To build the common targets in one command:

```bash
make package-all
```

The target list can be customized with `MEETWELL_TARGETS`, using space-separated `GOOS/GOARCH` pairs. Generated binaries are written to `bin/`.

## Features

- Add availability and exclusion rules.
- Use the calculation range as an all-day baseline when no availability rule is configured.
- Support daily, weekly, and specific-date schedules.
- Apply specific-date rules across an inclusive date range.
- Configure an independent IANA time zone for every rule.
- Intersect availability rules and subtract excluded times.
- Handle overnight schedules and daylight-saving-time conversions.
- Display the final availability as a daily timeline in the target time zone.
- Automatically save configuration in the browser.
- Import and export configuration as JSON.
- Localized interface in Chinese and English with browser-language detection and a saved preference.
- Export the final schedule as plain text in Chinese or English.
