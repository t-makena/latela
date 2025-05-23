
import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen">
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
