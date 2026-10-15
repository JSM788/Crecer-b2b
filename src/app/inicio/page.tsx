"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  MapPin,
  Clock,
  Calendar,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  User,
} from "lucide-react";
import { DashboardShell } from "@/shared/layout/DashboardShell";

interface PriorityClient {
  initials: string;
  name: string;
  reason: string;
  clientId: string;
}

interface ActivityItem {
  iconType: "visit" | "order" | "user";
  text: React.ReactNode;
  time: string;
}

export default function InicioPage() {
  const [selectedRange, setSelectedRange] = useState("10 mar. 2025 – 16 mar. 2025");
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);

  // Data matching Dashboard-Inicio.png
  const priorityClients: PriorityClient[] = [
    {
      initials: "PL",
      name: "Pet Center La Molina",
      reason: "Sin compra hace 28 días",
      clientId: "cl-004",
    },
    {
      initials: "DP",
      name: "Distribuidora Patitas",
      reason: "Con crédito próximo a vencer",
      clientId: "cl-005",
    },
    {
      initials: "VH",
      name: "Veterinaria Huellitas",
      reason: "Pedido pendiente de pago",
      clientId: "cl-002",
    },
    {
      initials: "AS",
      name: "Agrovet San Miguel",
      reason: "Sin visitas en 21 días",
      clientId: "cl-006",
    },
  ];

  // Bar chart data matching Dashboard-Inicio.png
  // Days: Lun 10, Mar 11, Mié 12, Jue 13, Vie 14, Sáb 15, Dom 16
  const weeklyOrders = [
    { day: "Lun", date: "10 mar.", count: 4 },
    { day: "Mar", date: "11 mar.", count: 5.2 },
    { day: "Mié", date: "12 mar.", count: 6.1 },
    { day: "Jue", date: "13 mar.", count: 3.2 },
    { day: "Vie", date: "14 mar.", count: 7 },
    { day: "Sáb", date: "15 mar.", count: 1.8 },
    { day: "Dom", date: "16 mar.", count: 1.8 },
  ];

  const recentActivity: ActivityItem[] = [
    {
      iconType: "visit",
      text: (
        <span>
          <strong className="font-semibold text-zinc-900">Ana Torres</strong> registró una visita en{" "}
          <span className="text-zinc-700">Pet Market San Borja</span>
        </span>
      ),
      time: "Hoy, 10:24",
    },
    {
      iconType: "order",
      text: (
        <span>
          Se creó el pedido{" "}
          <Link
            href="/comercial/ventas/pedidos/ped-1042/"
            className="font-semibold text-zinc-900 hover:underline"
          >
            PED-1042
          </Link>{" "}
          para <span className="text-zinc-700">Pet Market San Borja</span>
        </span>
      ),
      time: "Hoy, 09:15",
    },
    {
      iconType: "user",
      text: (
        <span>
          <strong className="font-semibold text-zinc-900">Carlos Rojas</strong> actualizó información
          de <span className="text-zinc-700">Veterinaria Huellitas</span>
        </span>
      ),
      time: "Ayer, 16:40",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-5 max-w-[1320px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inicio</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Resumen general de la operación comercial</p>
          </div>

          {/* Date Range Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-2xs hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <span>{selectedRange}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 ml-1" />
            </button>

            {isRangeDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                {[
                  "10 mar. 2025 – 16 mar. 2025",
                  "03 mar. 2025 – 09 mar. 2025",
                  "Mes actual (marzo 2025)",
                  "Últimos 30 días",
                ].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setSelectedRange(range);
                      setIsRangeDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 text-zinc-700 transition-colors"
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3 Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Pedidos */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-700">
              <FileText className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Pedidos</p>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-zinc-900">24</span>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                  20%
                </span>
              </div>
              <p className="text-2xs text-zinc-400 mt-0.5">vs. semana anterior</p>
            </div>
          </div>

          {/* Card 2: Visitas */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-700">
              <MapPin className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Visitas</p>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-zinc-900">18</span>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                  6%
                </span>
              </div>
              <p className="text-2xs text-zinc-400 mt-0.5">vs. semana anterior</p>
            </div>
          </div>

          {/* Card 3: Pendientes */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-700">
              <Clock className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Pendientes</p>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl font-bold tracking-tight text-zinc-900">4</span>
                <span className="inline-flex items-center text-xs font-semibold text-rose-500">
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                  33%
                </span>
              </div>
              <p className="text-2xs text-zinc-400 mt-0.5">vs. semana anterior</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Clientes en prioridad */}
          <div className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Clientes en prioridad</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Requieren seguimiento esta semana</p>
              </div>
              <Link
                href="/comercial/clientes/"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors pt-0.5"
              >
                Ver todos
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {priorityClients.map((client) => (
                <div
                  key={client.clientId}
                  className="py-3 flex items-center justify-between group hover:bg-zinc-50/60 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-200/80 text-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {client.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">
                        {client.name}
                      </p>
                      <p className="text-2xs text-zinc-500 mt-0.5 truncate">{client.reason}</p>
                    </div>
                  </div>

                  <Link
                    href={`/comercial/clientes/${client.clientId}/`}
                    className="inline-flex items-center text-xs font-medium text-zinc-700 hover:text-zinc-950 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform"
                  >
                    Revisar
                    <ArrowRight className="h-3 w-3 ml-1 text-zinc-500 group-hover:text-zinc-900" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Pedidos de la semana & Actividad reciente */}
          <div className="lg:col-span-7 space-y-5">
            {/* Pedidos de la semana Card */}
            <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-900">Pedidos de la semana</h2>
                <span className="text-xs font-medium text-zinc-500">Total: 24 pedidos</span>
              </div>

              {/* Bar Chart Container */}
              <div className="pt-2 pb-1">
                <div className="relative h-44 flex items-end">
                  {/* Y-Axis Gridlines & Labels */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-2xs text-zinc-400 pr-2">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-0.5">
                      <span className="w-3 text-right">8</span>
                      <div className="w-full ml-2 border-b border-dashed border-zinc-100" />
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-0.5">
                      <span className="w-3 text-right">6</span>
                      <div className="w-full ml-2 border-b border-dashed border-zinc-100" />
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-0.5">
                      <span className="w-3 text-right">4</span>
                      <div className="w-full ml-2 border-b border-dashed border-zinc-100" />
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-0.5">
                      <span className="w-3 text-right">2</span>
                      <div className="w-full ml-2 border-b border-dashed border-zinc-100" />
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-0.5">
                      <span className="w-3 text-right">0</span>
                      <div className="w-full ml-2 border-b border-zinc-200" />
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="w-full pl-6 grid grid-cols-7 gap-2 sm:gap-4 items-end h-[85%] z-10">
                    {weeklyOrders.map((item, index) => {
                      // Max scale is 8
                      const heightPercent = Math.min(100, (item.count / 8) * 100);
                      return (
                        <div key={index} className="flex flex-col items-center h-full justify-end group">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-zinc-900 text-white text-2xs px-1.5 py-0.5 rounded shadow pointer-events-none">
                            {Math.round(item.count)}
                          </div>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] bg-zinc-500 rounded-t-xs hover:bg-zinc-700 transition-colors"
                          />
                          <div className="mt-2 text-center">
                            <p className="text-2xs font-semibold text-zinc-700 leading-tight">
                              {item.day}
                            </p>
                            <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 whitespace-nowrap">
                              {item.date}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Actividad reciente Card */}
            <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h2 className="text-sm font-bold text-zinc-900">Actividad reciente</h2>
                <Link
                  href="/comercial/visitas-jornadas/"
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Ver todas
                </Link>
              </div>

              <div className="divide-y divide-zinc-100">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between gap-3 text-xs group hover:bg-zinc-50/60 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
                        {activity.iconType === "visit" && <MapPin className="h-4 w-4" />}
                        {activity.iconType === "order" && <FileText className="h-4 w-4" />}
                        {activity.iconType === "user" && <User className="h-4 w-4" />}
                      </div>
                      <div className="text-zinc-700 truncate">{activity.text}</div>
                    </div>
                    <span className="text-2xs text-zinc-400 font-medium shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
