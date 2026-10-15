"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { PagoReportado } from "../models/finanzas.model";
import { RevisarPagoDrawer } from "./RevisarPagoDrawer";
import { ExternalLink, CheckCircle } from "lucide-react";

interface ConciliacionPagosTableProps {
  initialData: PagoReportado[];
}

export const ConciliacionPagosTable: React.FC<ConciliacionPagosTableProps> = ({
  initialData,
}) => {
  const [pagos, setPagos] = useState<PagoReportado[]>(initialData);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedPago, setSelectedPago] = useState<PagoReportado | null>(null);

  const filteredData = pagos.filter((p) => {
    const matchesSearch =
      !search ||
      p.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.operationNumber.toLowerCase().includes(search.toLowerCase());
    const matchesBank = bankFilter === "Todos" || p.paymentMethod.includes(bankFilter);
    const matchesStatus = statusFilter === "Todos" || p.status === statusFilter;

    return matchesSearch && matchesBank && matchesStatus;
  });

  const handleConciliar = (id: string) => {
    setPagos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Conciliado" } : p))
    );
  };

  const handleObservar = (id: string, motivo: string) => {
    setPagos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Observado", notes: motivo } : p))
    );
  };

  const columns: Column<PagoReportado>[] = [
    {
      header: "Pedido",
      accessorKey: "orderCode",
      width: "12%",
      cell: (row) => (
        <Link
          href={`/comercial/ventas/pedidos/${row.orderId}/`}
          className="font-bold text-zinc-900 hover:underline flex items-center gap-1"
        >
          {row.orderCode}
          <ExternalLink className="h-3 w-3 text-zinc-400" />
        </Link>
      ),
    },
    {
      header: "Cliente",
      sortable: true,
      width: "25%",
      cell: (row) => (
        <div>
          <p className="font-semibold text-zinc-900">{row.clientName}</p>
          <span className="text-2xs text-zinc-400">RUC: {row.clientRuc}</span>
        </div>
      ),
    },
    {
      header: "Método / Operación",
      width: "22%",
      cell: (row) => (
        <div>
          <p className="font-medium text-zinc-800">{row.paymentMethod}</p>
          <span className="text-2xs font-mono text-zinc-500">Op: {row.operationNumber}</span>
        </div>
      ),
    },
    {
      header: "Fecha Reporte",
      accessorKey: "dateReported",
      width: "15%",
      cell: (row) => <span className="text-zinc-600 text-xs">{row.dateReported}</span>,
    },
    {
      header: "Monto",
      accessorKey: "amount",
      sortable: true,
      width: "12%",
      cell: (row) => (
        <span className="font-bold text-zinc-900">
          S/ {row.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status",
      width: "14%",
      cell: (row) => (
        <Badge
          variant={
            row.status === "Conciliado"
              ? "success"
              : row.status === "Observado"
              ? "danger"
              : "warning"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Acción",
      width: "12%",
      className: "text-right",
      cell: (row) => (
        <Button
          size="sm"
          variant={row.status === "Conciliado" ? "secondary" : "default"}
          onClick={() => setSelectedPago(row)}
          className={`text-xs h-7 px-3 ${
            row.status === "Conciliado"
              ? "text-zinc-600"
              : "bg-[#27272a] hover:bg-zinc-800 text-white"
          }`}
        >
          {row.status === "Conciliado" ? "Ver detalle" : "Conciliar"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por pedido, cliente o N° operación..."
      >
        <div className="w-44">
          <Select
            label="Banco"
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            options={[
              { label: "Todos los bancos", value: "Todos" },
              { label: "BCP", value: "BCP" },
              { label: "BBVA", value: "BBVA" },
              { label: "Interbank", value: "Interbank" },
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "Todos los estados", value: "Todos" },
              { label: "Pendiente", value: "Pendiente" },
              { label: "Conciliado", value: "Conciliado" },
              { label: "Observado", value: "Observado" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        entityName="pagos"
      />

      <RevisarPagoDrawer
        isOpen={!!selectedPago}
        onClose={() => setSelectedPago(null)}
        pago={selectedPago}
        onConciliar={handleConciliar}
        onObservar={handleObservar}
      />
    </div>
  );
};
