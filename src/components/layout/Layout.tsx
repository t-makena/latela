
import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-[#0EA5E9]/5 to-[#F97316]/5">
      <div className="container mx-auto flex h-full min-h-screen flex-col md:flex-row p-2 md:p-4">
        {!isMobile && (
          <div className="w-full md:w-64 md:mr-6 mb-4 md:mb-0 sticky top-0">
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
