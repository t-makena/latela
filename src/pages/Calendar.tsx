import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Calendar = () => {
  // Mock data for the calendar
  const currentMonth = "October";
  const currentYear = 2025;
  const currentDate = 7;
  
  // Generate calendar dates for September 2024 (starting on Sunday)
  const calendarDates = [
    // Week 1
    { date: "01", isCurrentMonth: true },
    { date: "02", isCurrentMonth: true, isToday: true },
    { date: "03", isCurrentMonth: true },
    { date: "04", isCurrentMonth: true },
    { date: "05", isCurrentMonth: true },
    { date: "06", isCurrentMonth: true },
    { date: "07", isCurrentMonth: true },
    // Week 2
    { date: "08", isCurrentMonth: true },
    { date: "09", isCurrentMonth: true },
    { date: "10", isCurrentMonth: true },
    { date: "11", isCurrentMonth: true },
    { date: "12", isCurrentMonth: true },
    { date: "13", isCurrentMonth: true },
    { date: "14", isCurrentMonth: true },
    // Week 3
    { date: "15", isCurrentMonth: true },
    { date: "16", isCurrentMonth: true },
    { date: "17", isCurrentMonth: true },
    { date: "18", isCurrentMonth: true },
    { date: "19", isCurrentMonth: true },
    { date: "20", isCurrentMonth: true },
    { date: "21", isCurrentMonth: true },
    // Week 4
    { date: "22", isCurrentMonth: true },
    { date: "23", isCurrentMonth: true },
    { date: "24", isCurrentMonth: true },
    { date: "25", isCurrentMonth: true },
    { date: "26", isCurrentMonth: true },
    { date: "27", isCurrentMonth: true },
    { date: "28", isCurrentMonth: true },
    // Week 5
    { date: "29", isCurrentMonth: true },
    { date: "30", isCurrentMonth: true },
    { date: "31", isCurrentMonth: true },
    { date: "01", isCurrentMonth: false },
    { date: "02", isCurrentMonth: false },
    { date: "03", isCurrentMonth: false },
    { date: "04", isCurrentMonth: false },
  ];

  const dayLabels = ["m", "t", "w", "t", "f", "s", "s"];

  const events = [
    {
      date: "Today",
      title: "Jazz @ Armchair, Lower Main Rd",
      budget: 500
    },
    {
      date: "08 Sept",
      title: "Graduation @ Sarah Baartman Hall",
      budget: 1000
    }
  ];

  const totalBudget = 1500;

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header with Month/Year and Navigation */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-foreground">
          {currentMonth} {currentYear}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default" className="font-normal">
            Month
          </Button>
          <Button variant="outline" size="default" className="font-normal">
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Calendar Grid + Events Sidebar */}
      <div className="flex gap-8">
        {/* Calendar Grid */}
        <div className="flex-1 bg-card rounded-lg border shadow-sm p-8">
          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-4 mb-6">
            {dayLabels.map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-muted-foreground uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-4">
            {calendarDates.map((dateObj, index) => (
              <button
                key={index}
                className={`
                  h-20 flex items-center justify-center text-base rounded-full
                  transition-colors
                  ${dateObj.isToday 
                    ? 'bg-black text-white font-semibold' 
                    : dateObj.isCurrentMonth 
                      ? 'text-black font-normal hover:bg-gray-100' 
                      : 'text-gray-300 font-normal'
                  }
                `}
              >
                {dateObj.date}
              </button>
            ))}
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="w-80 space-y-6">
          <div className="bg-white rounded-3xl border-2 border-black p-6 space-y-6">
            <h2 className="text-xl font-bold text-black">Upcoming Events</h2>
            
            {events.map((event, index) => (
              <div key={index} className="space-y-2 pb-4 border-b border-black/10 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-semibold text-black underline">{event.date}</h3>
                <div className="space-y-1">
                  <p className="text-base text-black">{event.title}</p>
                  <p className="text-sm text-gray-600">Budget: R{event.budget.toLocaleString()}</p>
                </div>
              </div>
            ))}

            {/* Total Budget */}
            <div className="pt-4 border-t border-black/10">
              <p className="text-sm font-medium text-black">
                Total budget (next 30 days)
              </p>
              <p className="text-2xl font-bold text-black mt-1">
                R{totalBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
