import bgMain from '@/assets/backgrounds/bg-main.svg';
import { useIsMobile } from '@/hooks/use-mobile';

export const BackgroundProvider = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 bg-no-repeat bg-center bg-cover"
          style={{ backgroundImage: `url(${bgMain})` }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
      <img
        src={bgMain}
        alt=""
        className="object-cover"
        style={{
          transform: 'rotate(-90deg)',
          width: '100vh',
          height: '100vw',
        }}
      />
    </div>
  );
};
