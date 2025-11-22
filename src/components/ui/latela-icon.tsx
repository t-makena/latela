interface LatelaIconProps {
  className?: string;
}

export const LatelaIcon = ({ className = "h-8 w-8" }: LatelaIconProps) => {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="140"
        cy="200"
        r="110"
        className="fill-foreground"
      />
      <circle
        cx="200"
        cy="200"
        r="110"
        className="fill-foreground"
      />
      <circle
        cx="260"
        cy="200"
        r="110"
        className="fill-foreground"
      />
    </svg>
  );
};
