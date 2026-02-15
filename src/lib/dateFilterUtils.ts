import { 
  format, 
  subDays, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay
} from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateFilterOption = "1W" | "1M" | "3M" | "6M" | "1Y" | "custom";

/**
 * Get the date range for 1W filter (past 7 days including today)
 */
export const get1WDateRange = (): DateRange => {
  const today = new Date();
  const to = endOfDay(today);
  const from = startOfDay(subDays(today, 6)); // 6 days ago + today = 7 days
  return { from, to };
};

/**
 * Get the date range for 1M filter (past 4 weeks including current week)
 */
export const get1MDateRange = (): DateRange => {
  const today = new Date();
  const to = endOfDay(today);
  const from = startOfDay(subDays(today, 29)); // 29 days ago + today = 30 days
  return { from, to };
};

/**
 * Get the date range for 3M filter (past 3 months including current month)
 */
export const get3MDateRange = (): DateRange => {
  const today = new Date();
  const to = endOfDay(today);
  const from = startOfMonth(subMonths(today, 2)); // 2 months ago + current month = 3 months
  return { from, to };
};

/**
 * Get the date range for 6M filter (past 6 months including current month)
 */
export const get6MDateRange = (): DateRange => {
  const today = new Date();
  const to = endOfDay(today);
  const from = startOfMonth(subMonths(today, 5)); // 5 months ago + current month = 6 months
  return { from, to };
};

/**
 * Get the date range for 1Y filter (past 12 months including current month)
 */
export const get1YDateRange = (): DateRange => {
  const today = new Date();
  const to = endOfDay(today);
  const from = startOfMonth(subMonths(today, 11)); // 11 months ago + current month = 12 months
  return { from, to };
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
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  return days.map(day => format(day, "dd MMM")); // e.g. "15 Jan"
};

/**
 * Get x-axis labels for 3M filter (month names: Oct '25, Nov '25, Dec '25)
 */
export const get3MLabels = (dateRange: DateRange): string[] => {
  const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
  return months.map(month => format(month, "MMM ''yy"));
};

/**
 * Get x-axis labels for 6M filter (month names: Jul '25, Aug '25, etc.)
 */
export const get6MLabels = (dateRange: DateRange): string[] => {
  const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
  return months.map(month => format(month, "MMM ''yy"));
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
    case "3M":
      return get3MDateRange();
    case "6M":
      return get6MDateRange();
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
    case "3M":
      return get3MLabels(dateRange);
    case "6M":
      return get6MLabels(dateRange);
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
    case "3M":
      return "for the past 3 months";
    case "6M":
      return "for the past 6 months";
    case "1Y":
      return "for the past year";
    case "custom":
      return "for custom period";
    default:
      return "";
  }
};
