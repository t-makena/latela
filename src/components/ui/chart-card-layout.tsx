import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  filters?: ReactNode;
  className?: string;
  compact?: boolean;
}

export const ChartCardLayout = ({
  title,
  subtitle,
  children,
  filters,
  className,
  compact = false,
}: ChartCardLayoutProps) => {
  return (
    <div className={cn("chart-layout-container relative", className)}>
      {/* Title Card - Positioned top-left overlapping the graph card */}
      <div className="chart-title-card">
        <h3 className="heading-card text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Main Graph Card */}
      <div className="chart-graph-card">
        <div className={cn("pt-8", compact ? "pb-12" : "pb-14")}>
          {children}
        </div>
      </div>

      {/* Filter Card - Positioned bottom-center */}
      {filters && (
        <div className="chart-filter-card">
          {filters}
        </div>
      )}
    </div>
  );
};
