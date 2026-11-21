import * as React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { FloatingDock } from "./FloatingDock";
import { Footer } from "./Footer";

export const MainLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
      <div className="flex-1 flex flex-row min-h-0 w-full relative">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 flex flex-col">
          <Outlet />
        </main>
      </div>
      <FloatingDock />
      <Footer />
    </div>
  );
};
