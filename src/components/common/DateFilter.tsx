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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={selectedFilter === "1W" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("1W")}
        className="min-w-[60px]"
      >
        1W
      </Button>
      <Button
        variant={selectedFilter === "1M" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("1M")}
        className="min-w-[60px]"
      >
        1M
      </Button>
      <Button
        variant={selectedFilter === "1Y" ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterClick("1Y")}
        className="min-w-[60px]"
      >
        1Y
      </Button>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedFilter === "custom" ? "default" : "outline"}
            size="sm"
            className="min-w-[140px] justify-start"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedFilter === "custom" && customDateRange
              ? `${format(customDateRange.from, "PP")} - ${format(customDateRange.to, "PP")}`
              : "Custom Period"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={customDateRange}
            onSelect={handleDateRangeSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
