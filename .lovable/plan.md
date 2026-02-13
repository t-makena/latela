

## Replace All Backgrounds with Uploaded SVG

### What Changes

Replace the four existing PNG background images (multicolor light/dark, black-white light/dark) with the single uploaded SVG. The SVG will be used for all theme/palette combinations, rotated -90 degrees on all viewports.

### File Changes

**1. Copy the SVG into the project**

Copy `user-uploads://Colorful_Simple_Abstract_Phone_Wallpaper_1.svg` to `src/assets/backgrounds/bg-main.svg`.

**2. Simplify `src/components/layout/BackgroundProvider.tsx`**

- Remove all four PNG imports and the `backgrounds` map
- Remove the `useColorPalette` and `useTheme` hooks (no longer needed for background selection)
- Import the single SVG: `import bgMain from '@/assets/backgrounds/bg-main.svg'`
- Both mobile and desktop render the same SVG with `transform: rotate(-90deg)`, using the existing `img` approach with swapped viewport dimensions to ensure full coverage

The simplified component:

```text
BackgroundProvider
  - Import bgMain SVG
  - Render a fixed full-screen container
  - Display the SVG as an <img> rotated -90deg
  - Use width: 100vh, height: 100vw to cover the viewport after rotation
```

**3. Old PNG files can optionally be removed**

The four files in `src/assets/backgrounds/` (bg-multicolor-light.png, bg-multicolor-dark.png, bg-bw-light.png, bg-bw-dark.png) will no longer be imported anywhere and can be deleted to reduce bundle size.

### Technical Notes

- The SVG is 1080x1920 (portrait phone wallpaper), so the -90deg rotation makes it landscape-oriented, which works well for desktop. On mobile, the same rotation applies per the user's request.
- `object-cover` on the img ensures no gaps regardless of viewport aspect ratio.
- No database or dependency changes needed.

