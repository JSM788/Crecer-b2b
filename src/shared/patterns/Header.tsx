"use client";

import React, { useState } from "react";
import { Search, Bell, Menu, Droplets, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/shared/lib/auth-context";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("Aquamundo");

  return (
    <header className="h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Brand & Mobile/Collapse Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          title="Menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 pr-4 border-r border-zinc-200">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center">
            <Droplets className="h-4 w-4" />
          </div>
          <span className="font-bold text-base text-zinc-900 tracking-tight">Aquamundo</span>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center w-72 lg:w-96">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar en Aquamundo..."
              className="w-full h-8.5 pl-9 pr-3 text-xs bg-zinc-50 border border-zinc-200 rounded-md placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right: Company selector, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Company Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-700">
          <span className="text-zinc-400">Empresa:</span>
          <span className="font-medium text-zinc-900">{selectedCompany}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 ml-1" />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
          title="Notificaciones"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-md hover:bg-zinc-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-semibold">
              JP
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-xs font-medium text-zinc-900">
                {user?.name || "Juan Pérez"}
              </p>
              <p className="text-2xs text-zinc-400">{user?.role || "Comercial"}</p>
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-zinc-100">
                <p className="font-semibold text-zinc-900">{user?.name || "Juan Pérez"}</p>
                <p className="text-zinc-400 text-2xs">{user?.email || "jperez@aquamundo.pe"}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
