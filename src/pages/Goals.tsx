import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Goals = () => {
  return (
    <div className="space-y-2 relative z-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-georama">Goals</CardTitle>
          <p className="text-sm text-muted-foreground">Set and track your financial goals</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Goal management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;