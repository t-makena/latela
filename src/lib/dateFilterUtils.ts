import { 
  format, 
  subDays, 
  subWeeks, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth
} from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateFilterOption = "1W" | "1M" | "1Y" | "custom";

/**
 * Get the date range for 1W filter (past 7 days including today)
 */
export const get1WDateRange = (): DateRange => {
  const to = new Date();
  const from = subDays(to, 6); // 6 days ago + today = 7 days
  return { from, to };
};

/**
 * Get the date range for 1M filter (past 4 weeks including current week)
 */
export const get1MDateRange = (): DateRange => {
  const to = new Date();
  const from = subWeeks(to, 3); // 3 weeks ago + current week = 4 weeks
  return { from: startOfWeek(from, { weekStartsOn: 1 }), to };
};

/**
 * Get the date range for 1Y filter (past 12 months including current month)
 */
export const get1YDateRange = (): DateRange => {
  const to = new Date();
  const from = subMonths(to, 11); // 11 months ago + current month = 12 months
  return { from: startOfMonth(from), to };
};

/**
 * Get x-axis labels for 1W filter (individual days: Mon, Tue, Wed, etc.)
 */
export const get1WLabels = (dateRange: DateRange): string[] => {
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  return days.map(day => format(day, "EEE")); // Mon, Tue, Wed, etc.
};

/**
 * Get x-axis labels for 1M filter (week labels: Sep W3, Oct W1, etc.)
 */
export const get1MLabels = (dateRange: DateRange): string[] => {
  const weeks = eachWeekOfInterval(
    { start: dateRange.from, end: dateRange.to },
    { weekStartsOn: 1 }
  );
  
  return weeks.map(weekStart => {
    const monthAbbr = format(weekStart, "MMM");
    const weekOfMonth = Math.ceil(weekStart.getDate() / 7);
    return `${monthAbbr} W${weekOfMonth}`;
  });
};

/**
 * Get x-axis labels for 1Y filter (month names: Nov '24, Dec '24, etc.)
 */
export const get1YLabels = (dateRange: DateRange): string[] => {
  const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
  return months.map(month => format(month, "MMM ''yy")); // Nov '24, Dec '24, etc.
};

/**
 * Get the appropriate date range based on filter option
 */
export const getDateRangeForFilter = (
  filter: DateFilterOption,
  customRange?: DateRange
): DateRange => {
  switch (filter) {
    case "1W":
      return get1WDateRange();
    case "1M":
      return get1MDateRange();
    case "1Y":
      return get1YDateRange();
    case "custom":
      return customRange || get1WDateRange();
    default:
      return get1WDateRange();
  }
};

/**
 * Get the appropriate x-axis labels based on filter option
 */
export const getLabelsForFilter = (
  filter: DateFilterOption,
  dateRange: DateRange
): string[] => {
  switch (filter) {
    case "1W":
      return get1WLabels(dateRange);
    case "1M":
      return get1MLabels(dateRange);
    case "1Y":
      return get1YLabels(dateRange);
    case "custom":
      // For custom, determine based on range length
      const daysDiff = Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 14) {
        return get1WLabels(dateRange);
      } else if (daysDiff <= 60) {
        return get1MLabels(dateRange);
      } else {
        return get1YLabels(dateRange);
      }
    default:
      return get1WLabels(dateRange);
  }
};

/**
 * Get description text for the current filter
 */
export const getFilterDescription = (filter: DateFilterOption): string => {
  switch (filter) {
    case "1W":
      return "for the past week";
    case "1M":
      return "for the past month";
    case "1Y":
      return "for the past year";
    case "custom":
      return "for custom period";
    default:
      return "";
  }
};
