import React from "react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { getPedidos, getPedidoById, DetallePedidoView } from "@/modules/comercial/ventas";

export function generateStaticParams() {
  const pedidos = getPedidos();
  return pedidos.map((p) => ({
    id: p.id,
  }));
}

export default function DetallePedidoPage({ params }: { params: { id: string } }) {
  const pedido = getPedidoById(params.id);

  if (!pedido) {
    notFound();
  }

  return (
    <DashboardShell>
      <DetallePedidoView pedido={pedido} />
    </DashboardShell>
  );
}
