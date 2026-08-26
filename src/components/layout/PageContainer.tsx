import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {(title || actions) && (
            <div className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl">
                <div>
                  {title && (
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">{subtitle}</p>
                  )}
                </div>
                {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
              </div>
            </div>
          )}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

