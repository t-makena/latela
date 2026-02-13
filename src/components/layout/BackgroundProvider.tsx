import bgMain from '@/assets/backgrounds/bg-main.svg';

export const BackgroundProvider = () => {
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
