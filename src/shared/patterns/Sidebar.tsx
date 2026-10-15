"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  BookOpen,
  Package,
  CircleDollarSign,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const pathname = usePathname();
  const [comercialOpen, setComercialOpen] = useState(true);

  const isComercialActive = pathname?.startsWith("/comercial");

  const comercialSubItems = [
    { label: "Clientes", href: "/comercial/clientes/" },
    { label: "Visitas y jornadas", href: "/comercial/visitas-jornadas/" },
    { label: "Ventas", href: "/comercial/ventas/" },
    { label: "Solicitudes", href: "/comercial/solicitudes/" },
    { label: "Gastos", href: "/comercial/gastos/" },
  ];

  const mainItems = [
    { label: "Inicio", href: "/inicio/", icon: Home },
    {
      label: "Comercial",
      href: "/comercial/clientes/",
      icon: Users,
      hasChildren: true,
    },
    { label: "Catálogo", href: "/catalogo/", icon: BookOpen },
    { label: "Inventario", href: "/inventario/", icon: Package },
    { label: "Finanzas", href: "/finanzas/", icon: CircleDollarSign },
    { label: "Reportes", href: "/reportes/", icon: BarChart3 },
    { label: "Configuración", href: "/configuracion/", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "h-[calc(100vh-3.5rem)] bg-white border-r border-zinc-200 transition-all duration-200 flex flex-col shrink-0 select-none",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {mainItems.map((item) => {
          const Icon = item.icon;

          if (item.hasChildren) {
            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setComercialOpen(!comercialOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md transition-colors",
                    isComercialActive
                      ? "text-zinc-950 font-semibold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-zinc-500" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-zinc-400 transition-transform duration-200",
                        comercialOpen && "transform rotate-180"
                      )}
                    />
                  )}
                </button>

                {!collapsed && comercialOpen && (
                  <div className="pl-6 pr-1 space-y-0.5 mt-0.5">
                    {comercialSubItems.map((sub) => {
                      const isSubActive =
                        pathname === sub.href ||
                        (sub.href !== "/comercial/clientes/" && pathname?.startsWith(sub.href)) ||
                        (sub.href === "/comercial/clientes/" &&
                          (pathname === "/comercial/clientes/" || pathname?.startsWith("/comercial/clientes")));

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "block px-2.5 py-1.5 text-xs rounded-md transition-colors",
                            isSubActive
                              ? "bg-zinc-100 text-zinc-950 font-medium"
                              : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-md transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
              )}
            >
              <Icon className="h-4 w-4 text-zinc-500" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
