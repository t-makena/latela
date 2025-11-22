interface LatelaIconProps {
  className?: string;
}

export const LatelaIcon = ({ className = "h-8 w-8" }: LatelaIconProps) => {
  return (
    <svg
      viewBox="0 0 320 320"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="80"
        cy="80"
        r="80"
        className="fill-foreground"
      />
      <circle
        cx="160"
        cy="160"
        r="80"
        className="fill-foreground"
      />
      <circle
        cx="240"
        cy="240"
        r="80"
        className="fill-foreground"
      />
    </svg>
  );
};
