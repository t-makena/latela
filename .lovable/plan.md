

## Update Latela Score Colors to Brand Palette

Replace default Tailwind color classes with the brand palette colors across all score-related elements in `src/components/budget/LatelaScoreCard.tsx`.

### Color Mapping

| Range | Current | New |
|-------|---------|-----|
| Good (>= 80) | `text-green-600` / `border-green-500` | Keep green (no brand override) |
| Moderate (>= 60) | `text-yellow-600` / `border-yellow-500` | `#fff500` (brand yellow) |
| Fair (>= 40) | `text-orange-500` / `border-orange-500` | `#f85f00` (brand orange) |
| Poor (< 40) | `text-red-600` / `border-red-500` | `#ff3132` (brand red) |

### Changes in `src/components/budget/LatelaScoreCard.tsx`

**1. `getScoreColor` function** -- Update text colors for score number display:
- `>= 60`: change from `text-yellow-600 dark:text-yellow-400` to `text-[#fff500]`
- `>= 40`: change from `text-orange-500 dark:text-orange-400` to `text-[#f85f00]`
- `< 40`: change from `text-red-600 dark:text-red-400` to `text-[#ff3132]`

**2. `getScoreBorderColor` function** -- Update circle border colors:
- `>= 60`: change from `border-yellow-500` to `border-[#fff500]`
- `>= 40`: change from `border-orange-500` to `border-[#f85f00]`
- `< 40`: change from `border-red-500` to `border-[#ff3132]`

**3. `getRiskIcon` function** -- Update icon colors:
- `mild`: change from `text-yellow-600 dark:text-yellow-400` to `text-[#fff500]`
- `moderate`: change from `text-orange-500 dark:text-orange-400` to `text-[#f85f00]`
- `high`: change from `text-red-500 dark:text-red-400` to `text-[#ff3132]`
- `critical`: change from `text-red-700 dark:text-red-500` to `text-[#ff3132]`

**4. `PillarProgress` component `getProgressColor` function** -- Update progress bar fill colors:
- `>= 60`: change from `bg-yellow-500` to `bg-[#fff500]`
- `>= 40`: change from `bg-orange-500` to `bg-[#f85f00]`
- `< 40`: change from `bg-red-500` to `bg-[#ff3132]`

Green stays as default Tailwind green since no brand override was specified.

