interface LatelaIconProps {
  className?: string;
}

export const LatelaIcon = ({ className = "h-8 w-8" }: LatelaIconProps) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow circle - offset left and up */}
      <circle
        cx="90"
        cy="95"
        r="85"
        className="fill-foreground"
      />
      
      {/* Main circle */}
      <circle
        cx="100"
        cy="100"
        r="85"
        className="fill-background stroke-foreground"
        strokeWidth="2"
      />
      
      {/* Letters "latela" arranged clockwise from 7 o'clock */}
      
      {/* 'l' - 7 o'clock (210°) */}
      <text
        x="71"
        y="150"
        fontFamily="Cooper BT, Georgia, serif"
        fontSize="32"
        fontWeight="900"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(210, 71, 150)"
      >l</text>
      
      {/* 'a' - 9 o'clock (270°) */}
      <text
        x="40"
        y="100"
        fontFamily="Cooper BT, Georgia, serif"
        fontSize="32"
        fontWeight="900"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(270, 40, 100)"
      >a</text>
      
      {/* 't' - 11 o'clock (330°) */}
      <text
        x="71"
        y="50"
        fontFamily="Cooper BT, Georgia, serif"
        fontSize="32"
        fontWeight="900"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(330, 71, 50)"
      >t</text>
      
      {/* 'e' - 1 o'clock (30°) */}
      <text
        x="129"
        y="50"
        fontFamily="Cooper BT, Georgia, serif"
        fontSize="32"
        fontWeight="900"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(30, 129, 50)"
      >e</text>
      
      {/* 'l' - 3 o'clock (90°) */}
      <text
        x="160"
        y="100"
        fontFamily="Cooper BT, Georgia, serif"
        fontSize="32"
        fontWeight="900"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(90, 160, 100)"
      >l</text>
      
      {/* 'a' - 5 o'clock (150°) */}
      <text
        x="129"
        y="150"
        fontFamily="Cooper BT, Georgia, serif"
        fontSize="32"
        fontWeight="900"
        className="fill-foreground"
        textAnchor="middle"
        dominantBaseline="middle"
        transform="rotate(150, 129, 150)"
      >a</text>
    </svg>
  );
};
