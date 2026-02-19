import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Download, Users, TrendingUp, Calendar, LogOut, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { downloadCSV } from "@/lib/exportUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import latelaLogo from "@/assets/latela-logo.png";

const ADMIN_EMAIL = "info@latela.co.za";

interface WaitlistEntry {
  id: string;
  name: string | null;
  email: string;
  created_at: string | null;
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
      <div className="bg-primary/10 p-3 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function AdminWaitlist() {
  const { user, signOut } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchWaitlist = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        setError(error.message);
      } else {
        setEntries(data ?? []);
      }
      setLoading(false);
    };

    fetchWaitlist();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="bg-destructive/10 p-4 rounded-full">
          <ShieldOff className="w-10 h-10 text-destructive" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-1">
            You don't have permission to view this page.
          </p>
          <p className="text-sm text-muted-foreground mt-1">Logged in as: {user?.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  // Compute stats
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const todayCount = entries.filter(e => e.created_at && new Date(e.created_at) >= startOfToday).length;
  const weekCount = entries.filter(e => e.created_at && new Date(e.created_at) >= startOfWeek).length;

  // Filtered rows
  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return (
      (e.name?.toLowerCase().includes(q) ?? false) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const rows = filtered.map((e, i) => ({
      "#": i + 1,
      Name: e.name ?? "",
      Email: e.email,
      Joined: e.created_at ? format(new Date(e.created_at), "dd MMM yyyy") : "",
    }));
    downloadCSV(rows as unknown as Record<string, unknown>[], `latela-waitlist-${format(now, "yyyy-MM-dd")}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={latelaLogo} alt="Latela" className="h-8 w-auto" />
          <Badge variant="secondary" className="text-xs">Waitlist Admin</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total sign-ups" value={entries.length} />
          <StatCard icon={TrendingUp} label="Last 7 days" value={weekCount} />
          <StatCard icon={Calendar} label="Today" value={todayCount} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading waitlist…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-destructive">
              Error: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
              <Users className="w-8 h-8 opacity-40" />
              <p>{search ? "No results match your search." : "No sign-ups yet."}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.name ?? <span className="text-muted-foreground italic">—</span>}
                    </TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.created_at
                        ? format(new Date(entry.created_at), "dd MMM yyyy")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-sm text-muted-foreground text-right">
            Showing {filtered.length} of {entries.length} entries
          </p>
        )}
      </main>
    </div>
  );
}
