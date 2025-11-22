interface LatelaIconProps {
  className?: string;
}

export const LatelaIcon = ({ className = "h-8 w-8" }: LatelaIconProps) => {
  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="80"
        cy="80"
        r="75"
        className="fill-foreground stroke-background"
        strokeWidth="3"
      />
      <circle
        cx="120"
        cy="120"
        r="75"
        className="fill-foreground stroke-background"
        strokeWidth="3"
      />
      <circle
        cx="160"
        cy="160"
        r="75"
        className="fill-foreground stroke-background"
        strokeWidth="3"
      />
    </svg>
  );
};
