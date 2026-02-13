

## Match Chart Card Title Sizes to "Account Insight"

### Problem
The chart card titles ("Balance", "Spending by Category", "Spending Trend") use smaller font sizes (`text-base` / `text-lg`) compared to the "Account Insight" card which uses the `heading-main` class (27px desktop / 19px mobile, Cooper BT font). The subtitles also need proportional sizing.

### Changes

**1. `src/components/financial-insight/FinancialInsightContent.tsx`**

- **Balance card (desktop, line 551)**: Change `className="text-base"` to `className="heading-main"` on the CardTitle
- **Balance card (mobile, line 475)**: Change `className="text-base font-medium"` to `className="heading-card"` on the div
- **Balance subtitle (desktop, line 552)**: Change `text-[10px]` to `text-xs`
- **Balance subtitle (mobile, line 476)**: Change `text-[10px]` to `text-xs`
- **Spending by Category card (desktop, line 764)**: Change `className="text-base"` to `className="heading-main"` on the CardTitle
- **Spending by Category (mobile, line 643)**: Change `className="text-base font-medium"` to `className="heading-card"`
- **Spending by Category subtitle (desktop, line 769)**: Change `text-[10px]` to `text-xs`
- **Spending by Category subtitle (mobile, line 648)**: Change `text-[10px]` to `text-xs`

**2. `src/components/dashboard/EnhancedSpendingChart.tsx`**

- **Spending Trend title (line 126)**: Change desktop class from `text-lg font-semibold` to `heading-main`, and mobile from `text-base font-semibold` to `heading-card`
- **Spending Trend subtitle (line 127)**: Change desktop from `text-sm` to `text-xs`, mobile stays `text-xs`

This ensures all chart section titles use the same Cooper BT heading style as "Account Insight", with appropriately scaled subtitles.
