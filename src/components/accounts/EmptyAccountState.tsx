import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyAccountStateProps {
  onClick: () => void;
}

export const EmptyAccountState = ({ onClick }: EmptyAccountStateProps) => {
  return (
    <Card 
      className="rounded-3xl border border-border shadow-lg lg:hover:scale-[1.02] lg:hover:shadow-xl bg-muted/30 cursor-pointer transition-all active:bg-muted/40 lg:active:bg-muted/30"
      onClick={onClick}
    >
      <CardContent className="p-12 flex flex-col items-center justify-center min-h-[280px]">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 transition-all group-hover:bg-primary/20">
          <Plus className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Add a new account</h3>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Connect your bank account to start tracking your finances
        </p>
      </CardContent>
    </Card>
  );
};
