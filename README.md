# Meetwell · Meeting Scheduler

A visual meeting-time planner built with React, Vite, and TypeScript.

## Development

Install the dependencies and start the local development server:

```bash
npm install
npm run dev
```

## Verification

Run the test suite and production build:

```bash
npm test
npm run build
```

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
