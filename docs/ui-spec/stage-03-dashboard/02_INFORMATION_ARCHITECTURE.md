# Information Architecture

## Dashboard Purpose

The Dashboard should answer four operator questions quickly:

1. How is the selected period performing financially?
2. Are there operational issues needing attention?
3. Is shuttlecock stock healthy?
4. Which recent sessions need review?

## Proposed Page Order

### 1. Page Header

Purpose:

- orient the user
- provide quick routes to Schedule, Finance, Inventory

Must preserve:

- route targets: `/schedule`, `/finance`, `/inventory`

### 2. Report Period Control

Purpose:

- switch between month/year reporting
- select month or year

Stage 03 target:

- migrate to `FilterBar`
- keep state and handlers unchanged
- keep one-line desktop layout and stacked mobile layout

### 3. Primary KPI Row

Purpose:

- show period-level revenue, expense, profit, inventory

Stage 03 target:

- migrate from `MetricCard` to `StatCard`
- keep all values and helper formatting unchanged

Cards:

- Doanh thu
- Chi phí
- Lợi nhuận
- Tồn kho cầu

### 4. Daily Cashflow

Purpose:

- provide daily rhythm and spike detection

Stage 03 target:

- improve chart container density and label hierarchy
- preserve `dailyFinance` mapping and `chartMax` logic

### 5. Operational Insight Row

Purpose:

- show cost breakdown, alerts, and low stock items

Stage 03 target:

- keep as supporting insight cards
- reduce visual noise
- keep links and empty states intact

Cards:

- Cơ cấu chi phí
- Cần chú ý
- Tồn kho cần chú ý

### 6. Recent Sessions

Purpose:

- review latest session performance and navigate to session detail

Stage 03 target:

- keep existing `DataTable` adoption
- preserve exact columns and action route

## Content Priority

Priority order:

1. KPI values
2. operational warnings
3. recent sessions needing review
4. trend/chart context
5. cost/inventory supporting detail

## Non-Goals

- No new dashboard modules.
- No new report types.
- No new drill-down behavior.
- No route changes.
- No changing the runtime location.

