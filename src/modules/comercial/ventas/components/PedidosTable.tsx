"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/lib/utils";
import { Pedido } from "../models/venta.model";

interface PedidosTableProps {
  pedidos: Pedido[];
}

export const PedidosTable: React.FC<PedidosTableProps> = ({ pedidos }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [seller, setSeller] = useState("Todos");

  const filtered = pedidos.filter((p) => {
    const matchesSearch =
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.clienteName.toLowerCase().includes(search.toLowerCase());
    const matchesSeller = seller === "Todos" || p.seller === seller;

    return matchesSearch && matchesSeller;
  });

  const columns: Column<Pedido>[] = [
    {
      header: "Pedido",
      accessorKey: "code",
      cell: (row) => (
        <Link
          href={`/comercial/ventas/pedidos/${row.id}/`}
          className="font-semibold text-zinc-900 hover:underline"
        >
          {row.code}
        </Link>
      ),
    },
    {
      header: "Cliente",
      accessorKey: "clienteName",
      cell: (row) => <span className="font-medium text-zinc-900">{row.clienteName}</span>,
    },
    {
      header: "Total",
      cell: (row) => (
        <span className="font-semibold text-zinc-900">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: "Pago",
      cell: (row) => (
        <Badge variant={row.paymentStatus === "Conciliado" ? "success" : "warning"}>
          {row.paymentStatus}
        </Badge>
      ),
    },
    {
      header: "Reserva",
      cell: (row) => (
        <Badge variant={row.reservationStatus === "Confirmada" ? "success" : "warning"}>
          {row.reservationStatus}
        </Badge>
      ),
    },
    {
      header: "Acción",
      className: "w-24 text-right",
      cell: (row) => (
        <Link href={`/comercial/ventas/pedidos/${row.id}/`}>
          <Button size="sm" variant="secondary" className="h-7 text-xs px-3">
            Ver
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar pedidos, cliente..."
      >
        <div className="w-36">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Pendiente", value: "Pendiente" },
              { label: "Conciliado", value: "Conciliado" },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            label="Vendedor"
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
        entityName="pedidos"
      />
    </div>
  );
};
