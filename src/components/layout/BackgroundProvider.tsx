import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useColorPalette } from '@/hooks/useColorPalette';
import { useIsMobile } from '@/hooks/use-mobile';

// Import all background images - Multicolor
import bgMulticolorLight1 from '@/assets/backgrounds/bg-multicolor-light-1.png';
import bgMulticolorLight2 from '@/assets/backgrounds/bg-multicolor-light-2.png';
import bgMulticolorLight3 from '@/assets/backgrounds/bg-multicolor-light-3.png';
import bgMulticolorLight4 from '@/assets/backgrounds/bg-multicolor-light-4.png';
import bgMulticolorDark1 from '@/assets/backgrounds/bg-multicolor-dark-1.png';
import bgMulticolorDark2 from '@/assets/backgrounds/bg-multicolor-dark-2.png';
import bgMulticolorDark3 from '@/assets/backgrounds/bg-multicolor-dark-3.png';
import bgMulticolorDark4 from '@/assets/backgrounds/bg-multicolor-dark-4.png';

// Import all background images - Black & White
import bgBwLight1 from '@/assets/backgrounds/bg-bw-light-1.png';
import bgBwLight2 from '@/assets/backgrounds/bg-bw-light-2.png';
import bgBwLight3 from '@/assets/backgrounds/bg-bw-light-3.png';
import bgBwLight4 from '@/assets/backgrounds/bg-bw-light-4.png';
import bgBwDark1 from '@/assets/backgrounds/bg-bw-dark-1.png';
import bgBwDark2 from '@/assets/backgrounds/bg-bw-dark-2.png';
import bgBwDark3 from '@/assets/backgrounds/bg-bw-dark-3.png';
import bgBwDark4 from '@/assets/backgrounds/bg-bw-dark-4.png';

const backgroundImages = {
  multicolor: {
    light: [bgMulticolorLight1, bgMulticolorLight2, bgMulticolorLight3, bgMulticolorLight4],
    dark: [bgMulticolorDark1, bgMulticolorDark2, bgMulticolorDark3, bgMulticolorDark4],
  },
  blackwhite: {
    light: [bgBwLight1, bgBwLight2, bgBwLight3, bgBwLight4],
    dark: [bgBwDark1, bgBwDark2, bgBwDark3, bgBwDark4],
  },
};

// Desktop transforms: 90°, -90°, with optional horizontal flip
const desktopTransforms = [
  'rotate-90',
  '-rotate-90',
  'rotate-90 -scale-x-100',
  '-rotate-90 -scale-x-100',
];

// Mobile/Tablet transforms: 0°, 180°, vertical flip, or both
const mobileTransforms = [
  '',
  'rotate-180',
  '-scale-y-100',
  'rotate-180 -scale-y-100',
];

// Simple hash function to get consistent random value from string
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const BackgroundProvider = () => {
  const { pathname } = useLocation();
  const { theme, resolvedTheme } = useTheme();
  const { colorPalette } = useColorPalette();
  const isMobile = useIsMobile();

  const currentTheme = resolvedTheme || theme || 'light';
  const isDark = currentTheme === 'dark';

  const { backgroundImage, transform } = useMemo(() => {
    // Get images based on palette and theme
    const images = backgroundImages[colorPalette]?.[isDark ? 'dark' : 'light'] || 
                   backgroundImages.multicolor.light;
    
    // Use pathname hash to select image and transform deterministically
    const pathHash = hashString(pathname);
    const imageIndex = pathHash % images.length;
    const selectedImage = images[imageIndex];

    // Select transform based on device type
    const transforms = isMobile ? mobileTransforms : desktopTransforms;
    const transformIndex = (pathHash >> 4) % transforms.length;
    const selectedTransform = transforms[transformIndex];

    return {
      backgroundImage: selectedImage,
      transform: selectedTransform,
    };
  }, [pathname, colorPalette, isDark, isMobile]);

  // Parse transform for desktop
  const getDesktopTransform = () => {
    let rotateVal = '';
    let scaleVal = '';
    
    if (transform.includes('rotate-90')) {
      rotateVal = 'rotate(90deg)';
    } else if (transform.includes('-rotate-90')) {
      rotateVal = 'rotate(-90deg)';
    }
    
    if (transform.includes('-scale-x-100')) {
      scaleVal = 'scaleX(-1)';
    }
    
    return `translate(-50%, -50%) ${rotateVal} ${scaleVal}`.trim();
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute bg-no-repeat bg-center bg-cover"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          ...(isMobile ? {
            inset: 0,
            transform: transform || undefined,
          } : {
            // Desktop: swap dimensions so portrait image fills landscape when rotated
            width: '100vh',
            height: '100vw',
            top: '50%',
            left: '50%',
            transform: getDesktopTransform(),
          }),
        }}
      />
    </div>
  );
};
