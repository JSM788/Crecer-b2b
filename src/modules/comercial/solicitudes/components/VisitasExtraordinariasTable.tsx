"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { VisitaExtraordinaria } from "../models/solicitud.model";
import { RevisarSolicitudDrawer } from "./RevisarSolicitudDrawer";

interface VisitasExtraordinariasTableProps {
  solicitudes: VisitaExtraordinaria[];
  onOpenNew?: () => void;
}

export const VisitasExtraordinariasTable: React.FC<VisitasExtraordinariasTableProps> = ({
  solicitudes: initialSolicitudes,
  onOpenNew,
}) => {
  const [solicitudes, setSolicitudes] = useState<VisitaExtraordinaria[]>(initialSolicitudes);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [seller, setSeller] = useState("Todos");
  const [selectedItem, setSelectedItem] = useState<VisitaExtraordinaria | null>(null);

  const filtered = solicitudes.filter((s) => {
    const matchesSearch =
      !search ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "Todos" || s.status === status;
    const matchesSeller = seller === "Todos" || s.seller === seller;

    return matchesSearch && matchesStatus && matchesSeller;
  });

  const handleDecision = (action: "aprobar" | "rechazar", notes: string) => {
    if (!selectedItem) return;
    const newStatus = action === "aprobar" ? "Aprobada" : "Rechazada";
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === selectedItem.id ? { ...s, status: newStatus } : s))
    );
  };

  const columns: Column<VisitaExtraordinaria>[] = [
    {
      header: "Solicitud",
      accessorKey: "code",
      cell: (row) => <span className="font-semibold text-zinc-900">{row.code}</span>,
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      cell: (row) => <span className="font-medium text-zinc-900">{row.clientName}</span>,
    },
    {
      header: "Solicitante",
      accessorKey: "seller",
    },
    {
      header: "Motivo",
      accessorKey: "reason",
    },
    {
      header: "Estado",
      cell: (row) => {
        const variant =
          row.status === "Aprobada"
            ? "success"
            : row.status === "Pendiente"
            ? "warning"
            : "danger";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: "Acción",
      className: "w-24 text-right",
      cell: (row) => (
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs px-3"
          onClick={() => setSelectedItem(row)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar solicitudes, cliente..."
      >
        <div className="w-36">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Pendiente", value: "Pendiente" },
              { label: "Aprobada", value: "Aprobada" },
              { label: "Rechazada", value: "Rechazada" },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            label="Solicitante"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Ana Torres", value: "Ana Torres" },
              { label: "Luis Ramos", value: "Luis Ramos" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 self-end h-9">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span>10 mar. 2025 - 16 mar. 2025</span>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        entityName="solicitudes"
      />

      <RevisarSolicitudDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        solicitud={selectedItem}
        onDecide={handleDecision}
      />
    </div>
  );
};
