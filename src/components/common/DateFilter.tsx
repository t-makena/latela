import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export type DateFilterOption = "1W" | "1M" | "3M" | "6M" | "1Y" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateFilterProps {
  selectedFilter: DateFilterOption;
  onFilterChange: (filter: DateFilterOption, dateRange?: DateRange) => void;
  className?: string;
}

const FILTERS: { value: DateFilterOption; label: string }[] = [
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "custom", label: "Custom" },
];

export const DateFilter = ({ selectedFilter, onFilterChange, className }: DateFilterProps) => {
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleFilterClick = (filter: DateFilterOption) => {
    if (filter === "custom") {
      setIsCalendarOpen(true);
    } else {
      onFilterChange(filter);
    }
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      const dateRange = { from: range.from, to: range.to };
      setCustomDateRange(dateRange);
      onFilterChange("custom", dateRange);
      setIsCalendarOpen(false);
    }
  };

  const pillClass = "bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center";
  const inactiveClass = "text-muted-foreground hover:text-foreground";

  return (
    <div className={cn("flex items-center justify-center gap-5", className)}>
      {FILTERS.map(({ value, label }) => {
        const isActive = selectedFilter === value;

        if (value === "custom") {
          return (
            <Popover key={value} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "text-sm font-medium transition-all cursor-pointer",
                    isActive ? pillClass + " !w-auto px-3" : inactiveClass
                  )}
                >
                  {isActive && customDateRange
                    ? isMobile
                      ? "Custom"
                      : `${format(customDateRange.from, "PP")} – ${format(customDateRange.to, "PP")}`
                    : "Custom"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="end">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={handleDateRangeSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  numberOfMonths={isMobile ? 1 : 2}
                />
              </PopoverContent>
            </Popover>
          );
        }

        return (
          <button
            key={value}
            onClick={() => handleFilterClick(value)}
            className={cn(
              "text-sm font-medium transition-all cursor-pointer",
              isActive ? pillClass : inactiveClass
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
