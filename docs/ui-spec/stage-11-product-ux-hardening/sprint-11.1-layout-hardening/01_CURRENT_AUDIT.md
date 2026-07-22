# Sprint 11.1 Current Audit

## Current Findings

- `PageShell` wraps all pages in `.operational-x-scroll`, making page-level horizontal scrolling possible.
- Dashboard passes `minWidth="min-w-[720px] md:min-w-0"` to `PageShell`, which can force whole-page overflow on mobile.
- Dashboard chart and `DataTable` already have their own internal scroll containers.
- AppShell mobile navigation intentionally uses local horizontal scroll.
- DataTable, Users table, Runtime player panel and Dashboard chart are the correct places for controlled horizontal scroll.

## Layout Risks

- Removing page-level scroll must not hide table/chart content that needs scroll.
- Content-level wide data must remain inside local scroll containers.
- Main app shell must not change route/nav behavior.

