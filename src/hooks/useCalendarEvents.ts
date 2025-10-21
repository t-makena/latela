import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, addDays, format } from "date-fns";

export interface CalendarEvent {
  id: string;
  eventName: string;
  eventDate: Date;
  eventTime?: string;
  eventDescription?: string;
  budgetedAmount: number;
  actualAmount?: number;
  category?: string;
  location?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: Date;
  isCompleted: boolean;
  userId: string;
}

interface UseCalendarEventsParams {
  year: number;
  month: number;
}

export const useCalendarEvents = ({ year, month }: UseCalendarEventsParams) => {
  const queryClient = useQueryClient();

  // Fetch events for the current month
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["calendar-events", year, month],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));

      const { data, error } = await (supabase as any)
        .from("calendar_events")
        .select("*")
        .gte("event_date", format(monthStart, "yyyy-MM-dd"))
        .lte("event_date", format(monthEnd, "yyyy-MM-dd"))
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });

      if (error) throw error;

      return (data || []).map((event: any) => ({
        id: event.id,
        eventName: event.event_name,
        eventDate: new Date(event.event_date),
        eventTime: event.event_time,
        eventDescription: event.event_description,
        budgetedAmount: Number(event.budgeted_amount),
        actualAmount: event.actual_amount ? Number(event.actual_amount) : undefined,
        category: event.category,
        location: event.location,
        isRecurring: event.is_recurring,
        recurrencePattern: event.recurrence_pattern,
        recurrenceEndDate: event.recurrence_end_date ? new Date(event.recurrence_end_date) : undefined,
        isCompleted: event.is_completed,
        userId: event.user_id,
      }));
    },
  });

  // Fetch upcoming events (next 30 days)
  const { data: upcomingData } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysLater = addDays(today, 30);

      const { data, error } = await (supabase as any)
        .from("calendar_events")
        .select("*")
        .gte("event_date", format(today, "yyyy-MM-dd"))
        .lte("event_date", format(thirtyDaysLater, "yyyy-MM-dd"))
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });

      if (error) throw error;

      const events = (data || []).map((event: any) => ({
        id: event.id,
        eventName: event.event_name,
        eventDate: new Date(event.event_date),
        eventTime: event.event_time,
        eventDescription: event.event_description,
        budgetedAmount: Number(event.budgeted_amount),
        actualAmount: event.actual_amount ? Number(event.actual_amount) : undefined,
        category: event.category,
        location: event.location,
        isRecurring: event.is_recurring,
        isCompleted: event.is_completed,
        userId: event.user_id,
      }));

      const totalBudget = events.reduce((sum, event) => sum + event.budgetedAmount, 0);

      return { events, totalBudget };
    },
  });

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (newEvent: Omit<CalendarEvent, "id" | "userId">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("calendar_events").insert({
        user_id: user.id,
        event_name: newEvent.eventName,
        event_date: format(newEvent.eventDate, "yyyy-MM-dd"),
        event_time: newEvent.eventTime,
        event_description: newEvent.eventDescription,
        budgeted_amount: newEvent.budgetedAmount,
        actual_amount: newEvent.actualAmount,
        category: newEvent.category,
        location: newEvent.location,
        is_recurring: newEvent.isRecurring,
        recurrence_pattern: newEvent.recurrencePattern,
        recurrence_end_date: newEvent.recurrenceEndDate ? format(newEvent.recurrenceEndDate, "yyyy-MM-dd") : null,
        is_completed: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });

  // Update event mutation
  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.eventName) updateData.event_name = updates.eventName;
      if (updates.eventDate) updateData.event_date = format(updates.eventDate, "yyyy-MM-dd");
      if (updates.eventTime !== undefined) updateData.event_time = updates.eventTime;
      if (updates.eventDescription !== undefined) updateData.event_description = updates.eventDescription;
      if (updates.budgetedAmount !== undefined) updateData.budgeted_amount = updates.budgetedAmount;
      if (updates.actualAmount !== undefined) updateData.actual_amount = updates.actualAmount;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
      if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;

      const { error } = await (supabase as any)
        .from("calendar_events")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });

  // Delete event mutation
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
  });

  return {
    events,
    upcomingEvents: upcomingData?.events || [],
    totalUpcomingBudget: upcomingData?.totalBudget || 0,
    isLoading,
    error,
    createEvent: createEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
  };
};
