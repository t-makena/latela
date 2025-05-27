
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  budget: number;
  category: string;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Birthday Party",
      description: "Sarah's birthday celebration",
      date: new Date(2025, 4, 30),
      budget: 250,
      category: "Entertainment"
    },
    {
      id: "2",
      title: "Grocery Shopping",
      description: "Weekly grocery run",
      date: new Date(2025, 4, 28),
      budget: 150,
      category: "Food"
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    budget: "",
    category: ""
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const handleAddEvent = () => {
    if (selectedDate && newEvent.title && newEvent.budget) {
      const event: Event = {
        id: Date.now().toString(),
        title: newEvent.title,
        description: newEvent.description,
        date: selectedDate,
        budget: parseFloat(newEvent.budget),
        category: newEvent.category || "Other"
      };
      setEvents([...events, event]);
      setNewEvent({ title: "", description: "", budget: "", category: "" });
      setIsDialogOpen(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const totalBudgetForSelectedDate = selectedDateEvents.reduce((sum, event) => sum + event.budget, 0);

  const eventDates = events.map(event => event.date);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar & Budget Planning</h1>
        <p className="text-muted-foreground">
          Plan your upcoming events and manage their budgets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Event Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full border-0 pointer-events-auto"
              modifiers={{
                hasEvent: eventDates
              }}
              modifiersStyles={{
                hasEvent: { 
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  fontWeight: 'bold'
                }
              }}
              styles={{
                day_selected: {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="p-6 pt-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={!selectedDate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event for {selectedDate && format(selectedDate, "MMM dd")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Add Event for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Enter event title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Event description (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        placeholder="e.g., Entertainment, Food, Travel"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget">Estimated Budget (ZAR)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={newEvent.budget}
                        onChange={(e) => setNewEvent({ ...newEvent, budget: e.target.value })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Button onClick={handleAddEvent} className="w-full">
                      Add Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Events for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(event.budget)}
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                      {event.category}
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Budget for this day:</span>
                    <div className="flex items-center text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(totalBudgetForSelectedDate)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for this date</p>
                <p className="text-sm">Click "Add Event" to create one</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events & Budget Summary</CardTitle>
          {/* Combined summary stats inside the header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(events.reduce((sum, event) => sum + event.budget, 0))}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Average per Event</p>
              <p className="text-2xl font-bold text-blue-600">
                {events.length > 0 ? formatCurrency(events.reduce((sum, event) => sum + event.budget, 0) / events.length) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h3 className="font-semibold">All Upcoming Events</h3>
            {events.map((event) => (
              <div key={event.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(event.date, "MMM dd, yyyy")} • {event.category}
                  </p>
                </div>
                <div className="flex items-center text-green-600 font-medium">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(event.budget)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
