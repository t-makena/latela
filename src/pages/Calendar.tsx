import { CalendarIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Calendar = () => {
  // Mock data for the calendar
  const currentMonth = "September";
  const currentDate = 2;
  
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-8">
        <h1 className="text-3xl font-bold">latela</h1>
        <button className="p-2">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Calendar Section Header */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>

        {/* Calendar Card */}
        <div className="border border-gray-300 rounded-3xl p-6 space-y-4">
          {/* Month Header with Add Event Button */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">{currentMonth}</h3>
            <Button variant="ghost" className="text-base font-normal">
              Add Event
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayLabels.map((day, index) => (
                <div key={index} className="text-center text-sm text-gray-500 font-normal">
                  {day}
                </div>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.map((dateObj, index) => (
                <button
                  key={index}
                  className={`
                    aspect-square flex items-center justify-center text-base
                    ${dateObj.isToday 
                      ? 'bg-black text-white rounded-full font-normal' 
                      : dateObj.isCurrentMonth 
                        ? 'text-black font-normal hover:bg-gray-100 rounded-full' 
                        : 'text-gray-300 font-normal'
                    }
                  `}
                >
                  {dateObj.date}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-bold underline">{event.date}</h3>
              <div className="space-y-1">
                <p className="text-base">{event.title}</p>
                <p className="text-base">Budget: R{event.budget.toLocaleString()}</p>
              </div>
            </div>
          ))}

          {/* Total Budget */}
          <div className="pt-4">
            <p className="text-base">
              Total budget (next 30 days): R{totalBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
