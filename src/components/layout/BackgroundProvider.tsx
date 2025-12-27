import { useTheme } from 'next-themes';
import { useColorPalette } from '@/hooks/useColorPalette';

import bgMulticolorLight from '@/assets/backgrounds/bg-multicolor-light.png';
import bgMulticolorDark from '@/assets/backgrounds/bg-multicolor-dark.png';
import bgBwLight from '@/assets/backgrounds/bg-bw-light.png';
import bgBwDark from '@/assets/backgrounds/bg-bw-dark.png';

const backgrounds = {
  multicolor: { light: bgMulticolorLight, dark: bgMulticolorDark },
  blackwhite: { light: bgBwLight, dark: bgBwDark },
} as const;

export const BackgroundProvider = () => {
  const { resolvedTheme } = useTheme();
  const { colorPalette } = useColorPalette();
  
  const isDark = resolvedTheme === 'dark';
  const backgroundImage = backgrounds[colorPalette]?.[isDark ? 'dark' : 'light'] 
                         || backgrounds.multicolor.light;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
    </div>
  );
};
