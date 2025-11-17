import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { EventDialog } from "@/components/calendar/EventDialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const isMobile = useIsMobile();
  
  const currentMonth = format(currentDate, "MMMM");
  const currentYear = format(currentDate, "yyyy");
  
  const { events, upcomingEvents, totalUpcomingBudget, isLoading, createEvent } = useCalendarEvents({
    year: parseInt(currentYear),
    month: parseInt(format(currentDate, "M")),
  });
  // Generate calendar dates dynamically
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDates = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(date => ({
    date,
    isCurrentMonth: date.getMonth() === currentDate.getMonth(),
    isToday: isToday(date),
    hasEvents: events.some(event => isSameDay(new Date(event.eventDate), date)),
  }));

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddEvent = (date?: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleSaveEvent = async (event: any) => {
    try {
      await createEvent(event);
      toast.success("Event created successfully!");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return "Today";
    return format(date, "dd MMM");
  };

  const dayLabels = ["m", "t", "w", "t", "f", "s", "s"];

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'p-4' : 'p-8'}`}>
      {/* Header with Month/Year and Navigation */}
      <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-8'}`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-foreground`}>
          {currentMonth} {currentYear}
        </h1>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button variant="outline" size="default" className="font-normal">
                Month
              </Button>
              <Button variant="outline" size="default" className="font-normal" onClick={handleToday}>
                Today
              </Button>
            </>
          )}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {!isMobile && (
            <Button onClick={() => handleAddEvent()} className="ml-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Main Content: Calendar Grid + Events Sidebar */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'gap-6'}`}>
        {/* Calendar Grid */}
        <Card className={`flex-1 ${isMobile ? 'p-4' : 'p-8'} shadow-md`}>
          {/* Day Labels */}
          <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-2' : 'gap-4 mb-6'}`}>
            {dayLabels.map((day, index) => (
              <div key={index} className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground uppercase`}>
                {day}
              </div>
            ))}
          </div>

          {/* Date Grid */}
          <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-4'}`}>
            {calendarDates.map((dateObj, index) => (
              <button
                key={index}
                onClick={() => handleAddEvent(dateObj.date)}
                className={`
                  relative flex flex-col items-center justify-center ${isMobile ? 'text-sm h-10 w-10' : 'text-base h-14 w-14'} rounded-full transition-colors mx-auto
                  ${dateObj.isToday 
                    ? 'bg-primary text-primary-foreground font-semibold' 
                    : dateObj.isCurrentMonth 
                      ? 'text-foreground font-normal hover:bg-accent' 
                      : 'text-muted-foreground font-normal'
                  }
                `}
              >
                <span>{format(dateObj.date, "d")}</span>
                {dateObj.hasEvents && (
                  <div className={`absolute ${isMobile ? 'bottom-0.5 w-1 h-1' : 'bottom-1 w-1.5 h-1.5'} rounded-full bg-primary`} />
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Events Sidebar */}
        <div className={isMobile ? 'w-full' : 'w-80'}>
          <Card className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 shadow-md h-full flex flex-col`}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-foreground`}>Upcoming Events</h2>
            
            {isLoading ? (
              <p className="text-muted-foreground">Loading events...</p>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground">No upcoming events in the next 30 days</p>
            ) : (
              <div className="flex-1 space-y-6">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="space-y-2 pb-4 border-b border-border last:border-b-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-foreground underline">
                      {formatEventDate(event.eventDate)}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-base text-foreground">
                        {event.eventName}
                        {event.location && ` @ ${event.location}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Budget: R{event.budgetedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Budget */}
            <div className="pt-4 border-t border-border mt-auto">
              <p className="text-sm font-medium text-foreground">
                Total budget (next 30 days)
              </p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground mt-1`}>
                R{totalUpcomingBudget.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Calendar;
