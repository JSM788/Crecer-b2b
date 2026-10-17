"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Clock,
  Upload,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs } from "@/shared/components/ui/tabs";
import { formatCurrency } from "@/shared/lib/utils";
import { Pedido } from "../models/venta.model";
import { ReportarPagoDrawer } from "./ReportarPagoDrawer";
import { PedidoResumenTab } from "./PedidoResumenTab";
import { PedidoProductosTab } from "./PedidoProductosTab";
import { PedidoHistorialTab } from "./PedidoHistorialTab";

interface DetallePedidoViewProps {
  pedido: Pedido;
}

export const DetallePedidoView: React.FC<DetallePedidoViewProps> = ({ pedido }) => {
  const [activeTab, setActiveTab] = useState("resumen");
  const [isReportarOpen, setIsReportarOpen] = useState(false);

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "productos", label: "Productos" },
    { id: "pago_reserva", label: "Pago y reserva" },
    { id: "historial", label: "Historial" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Comercial", href: "/comercial/clientes/" },
          { label: "Ventas", href: "/comercial/ventas/" },
          { label: "Pedidos", href: "/comercial/ventas/" },
          { label: pedido.code },
        ]}
        title={`Pedido ${pedido.code}`}
        subtitle={`${pedido.clienteName} | RUC ${pedido.ruc}`}
        actions={undefined}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "resumen" && <PedidoResumenTab pedido={pedido} />}
      {activeTab === "productos" && <PedidoProductosTab pedido={pedido} />}
      {activeTab === "historial" && <PedidoHistorialTab pedido={pedido} />}

      {activeTab === "pago_reserva" && (
        <div className="space-y-5">
          {/* Status Cards Row (3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xs text-zinc-400">Pago</p>
                  <p className="text-xs font-bold text-zinc-900">Esperando archivo</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">Sube el comprobante de pago</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xs text-zinc-400">Reserva</p>
                  <p className="text-xs font-bold text-zinc-900">Confirmación SAP pendiente</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">Reserva provisional registrada</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xs text-zinc-400">Pedido</p>
                  <p className="text-xs font-bold text-zinc-900">Pendiente de validación</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">En revisión por administración</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Row: Resumen del Pedido & Reserva Provisional */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                  Resumen del pedido
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Total solicitado</span>
                    <span className="font-medium">10 productos</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Aceptados</span>
                    <span className="font-medium">8 productos</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>No atendidos</span>
                    <span className="font-medium text-amber-600">2 productos</span>
                  </div>
                  <div className="flex justify-between items-baseline font-bold text-sm text-zinc-900 pt-3 border-t border-zinc-100">
                    <span>Total del pedido</span>
                    <span className="text-base">{formatCurrency(pedido.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                  Reserva provisional
                </h3>
                <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-zinc-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Duración propuesta: 6 horas</p>
                    <p className="text-2xs text-zinc-500 mt-0.5">
                      A la espera de confirmación en SAP.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Card */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                Línea de tiempo
              </h3>

              <div className="space-y-4 text-xs pl-3 border-l border-zinc-200 ml-2">
                {pedido.timeline.map((item, idx) => (
                  <div key={idx} className="relative pl-3">
                    <span className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 ring-2 ring-white" />
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-zinc-900">{item.time}</span>
                      <span className="font-semibold text-zinc-800">{item.event}</span>
                    </div>
                    <p className="text-2xs text-zinc-500 mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ReportarPagoDrawer
        isOpen={isReportarOpen}
        onClose={() => setIsReportarOpen(false)}
        pedidoCode={pedido.code}
        clientName={pedido.clienteName}
        totalAmount={pedido.total}
      />
    </div>
  );
};
