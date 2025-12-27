import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackgroundProvider } from "./BackgroundProvider";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen relative">
      {/* Dynamic themed background */}
      <BackgroundProvider />
      
      <div className={`container mx-auto flex h-full flex-col md:flex-row ${isMobile ? 'p-0' : 'p-2 md:p-4'} relative z-10 gap-4`}>
        {!isMobile && (
          <div className="sticky top-0 h-screen">
            <Navbar />
          </div>
        )}
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 pt-20' : ''}`}>
          {children}
        </main>
        {isMobile && <Navbar />}
      </div>
    </div>
  );
};
