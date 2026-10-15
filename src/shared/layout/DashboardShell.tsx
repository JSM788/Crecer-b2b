"use client";

import React, { useState } from "react";
import { Header } from "@/shared/patterns/Header";
import { Sidebar } from "@/shared/patterns/Sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = "w-52"; // Exactly matching the left logo header block

  return (
    <div className="min-h-screen bg-[#fbfcfd] flex flex-col text-zinc-900">
      <Header
        onToggleSidebar={() => setCollapsed(!collapsed)}
        isCollapsed={collapsed}
        sidebarWidth={sidebarWidth}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar collapsed={collapsed} width={sidebarWidth} />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-6 flex flex-col justify-between">
          <div className="max-w-[1400px] w-full mx-auto">{children}</div>

          {/* Discreet watermark */}
          <div className="mt-8 pt-4 text-right">
            <span className="text-2xs text-zinc-400 select-none">Datos ficticios</span>
          </div>
        </main>
      </div>
    </div>
  );
};
