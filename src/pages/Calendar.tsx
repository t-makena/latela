import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { EventDialog } from "@/components/calendar/EventDialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDateForDialog, setSelectedDateForDialog] = useState<Date | undefined>();
  const [selectedDateForFilter, setSelectedDateForFilter] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<any | undefined>();
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTapDate, setLastTapDate] = useState<Date | null>(null);
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  const currentMonth = format(currentDate, "MMMM");
  const currentYear = format(currentDate, "yyyy");
  
  const { events, upcomingEvents, totalUpcomingBudget, isLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents({
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

  const handleDateClick = (date: Date) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    // Check if this is a double tap on the same date
    if (
      lastTapDate &&
      isSameDay(lastTapDate, date) &&
      now - lastTapTime < DOUBLE_TAP_DELAY
    ) {
      // Double tap - open dialog
      setSelectedDateForDialog(date);
      setDialogOpen(true);
      setLastTapTime(0);
      setLastTapDate(null);
    } else {
      // Single tap - filter events for this date
      setSelectedDateForFilter(date);
      setLastTapTime(now);
      setLastTapDate(date);
    }
  };

  const handleAddEvent = () => {
    // Use the currently selected filter date if available
    setSelectedDateForDialog(selectedDateForFilter || undefined);
    setSelectedEvent(undefined);
    setDialogOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setSelectedDateForDialog(undefined);
    setDialogOpen(true);
  };

  const handleSaveEvent = async (event: any) => {
    try {
      if (event.id) {
        await updateEvent(event);
        toast.success(t('calendar.eventUpdated'));
      } else {
        await createEvent(event);
        toast.success(t('calendar.eventCreated'));
      }
      setSelectedEvent(undefined);
    } catch (error) {
      toast.error(event.id ? t('calendar.failedToUpdate') : t('calendar.failedToCreate'));
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    try {
      await deleteEvent(eventId);
      toast.success(`"${eventName}" ${t('calendar.deletedSuccessfully')}`);
    } catch (error) {
      toast.error(t('calendar.failedToDelete'));
    }
  };

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return t('calendar.today');
    return format(date, "dd MMM");
  };

  // Filter events based on selected date
  const displayedEvents = selectedDateForFilter
    ? events.filter(event => isSameDay(new Date(event.eventDate), selectedDateForFilter))
    : upcomingEvents;

  const displayedTotalBudget = selectedDateForFilter
    ? displayedEvents.reduce((sum, event) => sum + event.budgetedAmount, 0)
    : totalUpcomingBudget;

  const getEventsSectionTitle = () => {
    if (!selectedDateForFilter) return t('calendar.upcomingEvents');
    if (isToday(selectedDateForFilter)) return t('calendar.todaysEvents');
    return `${t('calendar.eventsOn')} ${format(selectedDateForFilter, "dd MMM yyyy")}`;
  };

  const dayLabels = ["m", "t", "w", "t", "f", "s", "s"];

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'py-4' : 'p-8'}`}>
      {/* Header with Month/Year and Navigation */}
      <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-8'}`}>
        <h1 className="heading-main">
          {currentMonth} {currentYear}
        </h1>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button variant="outline" size="default" className="font-normal">
                {t('calendar.month')}
              </Button>
              <Button variant="outline" size="default" className="font-normal" onClick={handleToday}>
                {t('calendar.today')}
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
            <Button onClick={handleAddEvent} className="ml-4">
              <Plus className="h-4 w-4 mr-2" />
              {t('calendar.addEvent')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content: Calendar Grid + Events Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Calendar Grid */}
         <Card 
           className={`flex-1 w-full ${isMobile ? 'p-4' : 'p-8'} border border-foreground`}
        >
          {/* Day Labels */}
          <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-2' : 'gap-4 mb-6'}`}>
            {dayLabels.map((day, index) => (
              <div key={index} className="text-center chart-axis-text uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Date Grid */}
          <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-4'}`}>
            {calendarDates.map((dateObj, index) => {
              const isSelectedDate = selectedDateForFilter && isSameDay(dateObj.date, selectedDateForFilter);
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(dateObj.date)}
                  className={`
                    relative flex flex-col items-center justify-center ${isMobile ? 'text-sm h-10 w-10' : 'text-base h-14 w-14'} rounded-full transition-colors mx-auto
                    ${dateObj.isToday 
                      ? 'bg-primary text-primary-foreground font-semibold' 
                      : isSelectedDate
                        ? 'bg-accent border-2 border-primary text-foreground font-semibold'
                        : dateObj.isCurrentMonth 
                          ? 'text-foreground font-normal hover:bg-accent' 
                          : 'text-muted-foreground font-normal'
                    }
                  `}
                >
                  <span>{format(dateObj.date, "d")}</span>
                  {dateObj.hasEvents && (
                    <div className={`absolute ${isMobile ? 'bottom-0.5 w-1 h-1' : 'bottom-1 w-1.5 h-1.5'} rounded-full ${dateObj.isToday ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Events Sidebar */}
        <div className="w-full lg:w-80">
           <Card 
             className={`w-full ${isMobile ? 'p-4' : 'p-6'} space-y-6 h-full flex flex-col border border-foreground`}
          >
            <div className="flex items-center justify-between">
              <h2 className="heading-card">
                {getEventsSectionTitle()}
              </h2>
              {isMobile ? (
                <Button
                  size="sm"
                  onClick={handleAddEvent}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t('common.add')}
                </Button>
              ) : (
                selectedDateForFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDateForFilter(undefined)}
                    className="text-xs"
                  >
                    {t('calendar.clear')}
                  </Button>
                )
              )}
            </div>
            
            {isLoading ? (
              <p className="text-muted-foreground">{t('calendar.loadingEvents')}</p>
            ) : displayedEvents.length === 0 ? (
              <p className="text-muted-foreground">
                {selectedDateForFilter 
                  ? `${t('calendar.noEventsOn')} ${format(selectedDateForFilter, "dd MMM yyyy")}`
                  : t('calendar.noUpcomingEventsNext30Days')
                }
              </p>
            ) : (
              <div className="flex-1 space-y-6">
                {displayedEvents.map((event) => (
                  <div key={event.id} className="space-y-2 pb-4 border-b border-border last:border-b-0 last:pb-0">
                    {!selectedDateForFilter && (
                      <h3 className="table-header-text underline">
                        {formatEventDate(event.eventDate)}
                      </h3>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="table-body-text hover:text-primary transition-colors text-left flex-1"
                        >
                          {event.eventName}
                          {event.location && ` @ ${event.location}`}
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.eventName)}
                          className="text-muted-foreground hover:text-destructive active:text-destructive transition-colors p-1"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="label-text">
                        {t('calendar.budget')}: R{event.budgetedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Budget */}
            <div className="pt-4 border-t border-border mt-auto">
              <p className="label-text">
                {selectedDateForFilter 
                  ? `${t('calendar.totalFor')} ${format(selectedDateForFilter, "dd MMM")}`
                  : t('calendar.totalBudgetNext30Days')
                }
              </p>
              <p className="balance-secondary mt-1 currency">
                R{displayedTotalBudget.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedEvent(undefined);
        }}
        onSave={handleSaveEvent}
        selectedDate={selectedDateForDialog}
        event={selectedEvent}
      />

    </div>
  );
};

export default Calendar;
