

## Replace Latela Logo with New SVG

### Summary
Replace the current circular Latela logo with the new provided SVG design featuring two overlapping oval shapes with a tilted effect.

### File to Modify

**`src/components/ui/latela-icon.tsx`**

Replace the entire SVG content with the new logo. The new SVG will need to:
1. Update the `viewBox` to match the new dimensions (`0 0 12487 7723`)
2. Replace all path/shape elements with the provided SVG paths
3. Keep the component interface (`className` prop) unchanged
4. Adapt the fill colors to use Tailwind classes for theme support where appropriate

### New Component Code

```typescript
interface LatelaIconProps {
  className?: string;
}

export const LatelaIcon = ({ className = "h-8 w-8" }: LatelaIconProps) => {
  return (
    <svg
      viewBox="0 0 12487 7723"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bottom shadow ellipse */}
      <path d="M8401.5 3557C9527.41 3557 10545.9 3790.66 11282.4 4167.68C12019.7 4545.14 12470 5063.71 12470 5632C12470 6200.29 12019.7 6718.86 11282.4 7096.32C10545.9 7473.34 9527.41 7707 8401.5 7707C7275.59 7707 6257.07 7473.34 5520.61 7096.32C4783.3 6718.86 4333 6200.29 4333 5632C4333 5063.71 4783.3 4545.14 5520.61 4167.68C6257.07 3790.66 7275.59 3557 8401.5 3557Z" className="fill-foreground stroke-foreground" strokeWidth="32"/>
      
      <rect x="4317" y="3726" width="8169" height="1912" className="fill-foreground"/>
      
      {/* Main right ellipse (white with black stroke) */}
      <path d="M8401.5 1668.5C9522.35 1668.5 10534.3 1901.2 11263.9 2274.73C11996.6 2649.81 12429.5 3157.82 12429.5 3703C12429.5 4248.18 11996.6 4756.19 11263.9 5131.27C10534.3 5504.8 9522.35 5737.5 8401.5 5737.5C7280.65 5737.5 6268.72 5504.8 5539.07 5131.27C4806.41 4756.19 4373.5 4248.18 4373.5 3703C4373.5 3157.82 4806.41 2649.81 5539.07 2274.73C6268.72 1901.2 7280.65 1668.5 8401.5 1668.5Z" className="fill-background stroke-foreground" strokeWidth="113"/>
      
      <line x1="4333" y1="3726" x2="4333" y2="5638" className="stroke-foreground" strokeWidth="32"/>
      
      <path d="M12470.5 3749V5661" className="stroke-foreground" strokeWidth="32"/>
      
      {/* Bottom left shadow ellipse (tilted) */}
      <path d="M4360.19 2624.72C5468.99 2429.21 6512.62 2482.45 7303.36 2725.86C8095.01 2969.55 8628.52 3402.05 8727.2 3961.71C8825.89 4521.36 8472.48 5110.25 7811.91 5610C7152.11 6109.18 6189.63 6516.16 5080.83 6711.67C3972.03 6907.18 2928.41 6853.93 2137.67 6610.53C1346.02 6366.84 812.506 5934.33 713.824 5374.68C615.142 4815.03 968.553 4226.14 1629.12 3726.38C2288.92 3227.21 3251.39 2820.23 4360.19 2624.72Z" className="fill-foreground stroke-foreground" strokeWidth="32"/>
      
      <rect x="367.094" y="3500.41" width="8169" height="1912" transform="rotate(-10 367.094 3500.41)" className="fill-foreground"/>
      
      {/* Main left ellipse (tilted, white with black stroke) */}
      <path d="M4032.26 764.907C5136.08 570.274 6173.05 623.718 6956.47 864.873C7743.13 1107.02 8257.68 1532.14 8352.35 2069.04C8447.02 2605.94 8108.9 3181.41 7452.51 3678.01C6798.81 4172.57 5842.65 4577.46 4738.83 4772.09C3635.01 4966.72 2598.04 4913.28 1814.62 4672.12C1027.96 4429.97 513.41 4004.85 418.74 3467.95C324.07 2931.05 662.187 2355.59 1318.59 1858.99C1972.29 1364.43 2928.44 959.54 4032.26 764.907Z" className="fill-background stroke-foreground" strokeWidth="113"/>
      
      <line x1="382.851" y1="3497.64" x2="714.866" y2="5380.59" className="stroke-foreground" strokeWidth="32"/>
      
      <path d="M8400.72 2107.23L8732.73 3990.18" className="stroke-foreground" strokeWidth="32"/>
    </svg>
  );
};
```

### Technical Details

- **ViewBox**: Updated from `0 0 200 200` to `0 0 12487 7723` to match the new logo dimensions
- **Theme Support**: Replaced hardcoded `fill="black"` and `fill="white"` with Tailwind classes:
  - `fill="black"` → `className="fill-foreground"`
  - `fill="white"` → `className="fill-background"`
  - `stroke="black"` → `className="stroke-foreground"`
- **Aspect Ratio**: The new logo has a wider aspect ratio (~1.6:1) compared to the old square logo, which will affect how it displays in the current size classes

### Usage Impact

The logo is used in two places:
1. **Mobile header**: `h-10 w-10` - may need adjustment for the new aspect ratio
2. **Desktop sidebar (collapsed)**: `h-20 w-20` - may need adjustment for the new aspect ratio

Since the new logo is wider than tall, the square dimension classes will cause the logo to fit within that square, maintaining aspect ratio. If you want the logo larger, the height/width classes in the Navbar can be adjusted after seeing the result.

