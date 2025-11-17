import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export type DateFilterOption = "1W" | "1M" | "1Y" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateFilterProps {
  selectedFilter: DateFilterOption;
  onFilterChange: (filter: DateFilterOption, dateRange?: DateRange) => void;
  className?: string;
}

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

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant={selectedFilter === "1W" ? "default" : "outline"}
        size={isMobile ? "sm" : "sm"}
        onClick={() => handleFilterClick("1W")}
        className={isMobile ? "min-w-[48px] h-8 text-xs px-2" : "min-w-[60px]"}
      >
        1W
      </Button>
      <Button
        variant={selectedFilter === "1M" ? "default" : "outline"}
        size={isMobile ? "sm" : "sm"}
        onClick={() => handleFilterClick("1M")}
        className={isMobile ? "min-w-[48px] h-8 text-xs px-2" : "min-w-[60px]"}
      >
        1M
      </Button>
      <Button
        variant={selectedFilter === "1Y" ? "default" : "outline"}
        size={isMobile ? "sm" : "sm"}
        onClick={() => handleFilterClick("1Y")}
        className={isMobile ? "min-w-[48px] h-8 text-xs px-2" : "min-w-[60px]"}
      >
        1Y
      </Button>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedFilter === "custom" ? "default" : "outline"}
            size={isMobile ? "sm" : "sm"}
            className={isMobile ? "h-8 text-xs px-2" : "min-w-[140px] justify-start"}
          >
            <CalendarIcon className={isMobile ? "h-3 w-3" : "mr-2 h-4 w-4"} />
            {!isMobile && (selectedFilter === "custom" && customDateRange
              ? `${format(customDateRange.from, "PP")} - ${format(customDateRange.to, "PP")}`
              : "Custom Period")}
            {isMobile && selectedFilter === "custom" && "Cus"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white z-50" align="end">
          <Calendar
            mode="range"
            selected={customDateRange}
            onSelect={handleDateRangeSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            numberOfMonths={isMobile ? 1 : 2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
