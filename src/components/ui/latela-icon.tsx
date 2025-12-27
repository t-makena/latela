interface LatelaIconProps {
  className?: string;
}

export const LatelaIcon = ({ className = "h-8 w-8" }: LatelaIconProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crescent shadow - offset circle creating moon effect */}
      <circle
        cx="58"
        cy="50"
        r="42"
        className="fill-foreground/20"
      />
      
      {/* Main circle */}
      <circle
        cx="50"
        cy="50"
        r="42"
        className="fill-foreground"
      />
      
      {/* Circular text path */}
      <defs>
        <path
          id="textCircle"
          d="M 50,50 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0"
        />
      </defs>
      
      {/* "latela" text following circular path */}
      <text
        className="fill-background"
        style={{
          fontSize: '18px',
          fontFamily: 'Cooper Lt BT, serif',
          fontWeight: 700,
          letterSpacing: '0.15em',
        }}
      >
        <textPath
          href="#textCircle"
          startOffset="50%"
          textAnchor="middle"
        >
          latela
        </textPath>
      </text>
    </svg>
  );
};
