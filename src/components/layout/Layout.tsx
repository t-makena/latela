
import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-[#0D47A1]/10 to-[#F57C00]/10">
      <div className="container mx-auto flex h-screen p-4">
        {!isMobile && (
          <div className="w-64 mr-6">
            <Navbar />
          </div>
        )}
        <main className={`flex-1 overflow-y-auto pb-20 ${isMobile ? 'pb-24' : ''}`}>
          {children}
        </main>
        {isMobile && <Navbar />}
      </div>
    </div>
  );
};
