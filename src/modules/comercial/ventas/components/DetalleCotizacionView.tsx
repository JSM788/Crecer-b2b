"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Printer } from "lucide-react";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs } from "@/shared/components/ui/tabs";
import { formatCurrency } from "@/shared/lib/utils";
import { Cotizacion } from "../models/venta.model";

interface DetalleCotizacionViewProps {
  cotizacion: Cotizacion;
}

export const DetalleCotizacionView: React.FC<DetalleCotizacionViewProps> = ({ cotizacion }) => {
  const [activeTab, setActiveTab] = useState("resumen");

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "productos", label: "Productos" },
    { id: "historial", label: "Historial" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Comercial", href: "/comercial/clientes/" },
          { label: "Ventas", href: "/comercial/ventas/" },
          { label: "Cotizaciones", href: "/comercial/ventas/" },
          { label: cotizacion.code },
        ]}
        title={cotizacion.code}
        subtitle={cotizacion.clienteName}
        actions={
          <div className="flex items-center gap-2.5">
            <Badge variant="info">{cotizacion.status}</Badge>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <FileText className="h-4 w-4" /> Vista previa PDF
            </Button>
            {/* Ocultado temporalmente: acción ejecutada en App Móvil / ERP (SAP/Defontana)
            <Link href="/comercial/ventas/pedidos/nuevo/">
              <Button size="sm">Convertir a pedido</Button>
            </Link>
            */}
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "resumen" ? (
        <div className="space-y-5">
          {/* Top 2 Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* General Info */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                  Información general
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cliente</span>
                    <span className="font-semibold text-zinc-900">{cotizacion.clienteName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Fecha de emisión</span>
                    <span className="text-zinc-800">{cotizacion.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Válida hasta</span>
                    <span className="text-zinc-800">{cotizacion.validUntil}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Estado</span>
                    <Badge variant="info">{cotizacion.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ejecutiva comercial</span>
                    <span className="text-zinc-800">{cotizacion.seller}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Summary */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                  Resumen de la cotización
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Cantidad solicitada</span>
                    <span className="font-medium">10</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Cantidad ofrecida</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Cantidad no atendida</span>
                    <span className="font-medium text-amber-600">2</span>
                  </div>
                  <div className="flex justify-between items-baseline font-bold text-sm text-zinc-900 pt-3 border-t border-zinc-100">
                    <span>Total cotizado</span>
                    <span className="text-lg">{formatCurrency(cotizacion.amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Preview & Note */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-900">
                Vista previa del PDF
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* PDF Box */}
                <div className="lg:col-span-2 p-6 bg-white border border-zinc-200 rounded-lg shadow-sm space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <span className="font-black text-sm tracking-wider text-zinc-900 uppercase">
                      AQUAMUNDO
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900">COTIZACIÓN {cotizacion.code}</p>
                      <p className="text-2xs text-zinc-400">{cotizacion.date}</p>
                    </div>
                  </div>

                  <div className="text-2xs text-zinc-600 space-y-0.5">
                    <p className="font-bold text-zinc-900">Cliente: Pet Market</p>
                    <p>RUC 20123456789</p>
                    <p>Av. San Borja Norte 1234, San Borja, Lima</p>
                  </div>

                  <div className="border border-zinc-100 rounded overflow-hidden">
                    <table className="w-full text-left text-2xs">
                      <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-600">
                        <tr>
                          <th className="px-2 py-1.5">Producto</th>
                          <th className="px-2 py-1.5 text-center">Cantidad</th>
                          <th className="px-2 py-1.5 text-right">Precio unitario</th>
                          <th className="px-2 py-1.5 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-2 py-2 font-medium">Bravery Adulto 7 kg</td>
                          <td className="px-2 py-2 text-center">8</td>
                          <td className="px-2 py-2 text-right">S/ 180</td>
                          <td className="px-2 py-2 text-right font-bold">S/ 1,440</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right pt-2 border-t border-zinc-100">
                    <span className="font-bold text-xs text-zinc-900">
                      Total: {formatCurrency(cotizacion.amount)}
                    </span>
                  </div>
                </div>

                {/* Stock Warning Box */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start gap-2.5 text-2xs text-zinc-600 self-start">
                  <AlertCircle className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-900">
                      Esta cotización NO reserva stock físico.
                    </p>
                    <p>
                      El stock estará sujeto a disponibilidad al momento de generar el pedido y confirmar el pago.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <Link
              href="/comercial/ventas/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a cotizaciones
            </Link>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-zinc-400">
            <p className="text-sm font-medium text-zinc-600">Sección en preparación</p>
            <p className="text-xs mt-1">El detalle de {activeTab} se encuentra disponible en el resumen.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
