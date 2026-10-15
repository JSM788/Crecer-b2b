"use client";

import React, { useState } from "react";
import { Header } from "@/shared/patterns/Header";
import { Sidebar } from "@/shared/patterns/Sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-zinc-900">
      <Header onToggleSidebar={() => setCollapsed(!collapsed)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar collapsed={collapsed} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col justify-between">
          <div className="max-w-7xl w-full mx-auto">{children}</div>

          {/* Watermark in bottom right as seen in reference mockups */}
          <div className="mt-8 pt-4 text-right">
            <span className="text-2xs text-zinc-400 select-none">Datos ficticios</span>
          </div>
        </main>
      </div>
    </div>
  );
};
