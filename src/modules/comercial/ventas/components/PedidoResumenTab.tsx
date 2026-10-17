"use client";

import React from "react";
import {
  MapPin,
  User,
  Building,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/lib/utils";
import { Pedido } from "../models/venta.model";

interface PedidoResumenTabProps {
  pedido: Pedido;
}

export const PedidoResumenTab: React.FC<PedidoResumenTabProps> = ({ pedido }) => {
  return (
    <div className="space-y-5">
      {/* Top Row Grid: Client Info & Total */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Card (2 cols): Client Info */}
        <Card className="lg:col-span-2 shadow-xs border-zinc-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-sm shrink-0">
                {pedido.clienteName ? pedido.clienteName.slice(0, 2).toUpperCase() : "PM"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">{pedido.clienteName}</h3>
                <p className="text-2xs text-zinc-500">
                  Cliente: {pedido.clienteId ? pedido.clienteId.toUpperCase() : "CL-001"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-700">
                  <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>San Borja, Lima</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <User className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Comercial: {pedido.seller}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <Building className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Origen: App comercial</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Fecha de creación: 15 oct. 2026 · 16:20</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Cotización de origen: {pedido.cotizacionCode || "COT-1042"}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <DollarSign className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Condición solicitada: Contado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Card (1 col): Total del pedido */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <p className="text-2xs font-semibold text-zinc-500">Total del pedido</p>
              <p className="text-3xl font-extrabold text-zinc-950 mt-1 tracking-tight">
                {formatCurrency(pedido.total)}
              </p>
              <p className="text-2xs text-zinc-500 mt-1">8 unidades aceptadas · 1 producto</p>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span>Pendiente de validación</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: 3 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pago */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Pago</p>
              <p className="text-xs font-bold text-zinc-900">Esperando archivo</p>
              <p className="text-2xs text-zinc-500 mt-0.5">Sube el comprobante de pago</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Reserva */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Reserva</p>
              <p className="text-xs font-bold text-zinc-900">Confirmación SAP pendiente</p>
              <p className="text-2xs text-zinc-500 mt-0.5">Reserva provisional registrada</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pedido */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Pedido</p>
              <p className="text-xs font-bold text-zinc-900">Pendiente de validación</p>
              <p className="text-2xs text-zinc-500 mt-0.5">En revisión por administración</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Demanda del cliente & Información financiera */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2 cols): Demanda del cliente */}
        <Card className="lg:col-span-2 shadow-xs border-zinc-200">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              Demanda del cliente
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center py-2">
              <div className="p-3 bg-zinc-50 rounded-lg">
                <p className="text-2xs text-zinc-400 font-medium">Solicitadas</p>
                <p className="text-base font-bold text-zinc-950 mt-1">10 unidades</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg">
                <p className="text-2xs text-zinc-400 font-medium">Aceptadas</p>
                <p className="text-base font-bold text-zinc-950 mt-1">8 unidades</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg">
                <p className="text-2xs text-zinc-400 font-medium">No atendidas</p>
                <p className="text-base font-bold text-amber-600 mt-1">2 unidades</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg flex items-start gap-2.5 text-2xs text-zinc-600">
              <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3 w-3" />
              </div>
              <span>
                El cliente aceptó comprar 8 unidades. Las 2 restantes se registran como demanda no
                atendida, sin compromiso de entrega.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right (1 col): Información financiera */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-5 space-y-3.5 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Información financiera
              </h3>

              <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-md bg-white border border-zinc-200 text-zinc-700 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-950">Pago reportado: S/ 1,440</p>
                    <p className="text-2xs text-zinc-500">BCP · Operación 845219</p>
                    <p className="text-2xs text-zinc-400">16 oct. 2026 · 09:35</p>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                    <Clock className="h-3 w-3 text-zinc-500" /> Pendiente de conciliación
                  </span>
                </div>
              </div>
            </div>

            <div className="text-2xs text-zinc-400 pt-2 border-t border-zinc-100">
              <p>Última actualización del archivo financiero</p>
              <p className="font-medium text-zinc-600">16 oct. 2026 · 08:00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Notes */}
      <div className="flex items-center justify-between text-2xs text-zinc-400 pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span>
            Productos, condiciones y saldos: datos de SAP. Registro comercial y demanda: plataforma.
          </span>
        </div>
        <span>Datos ficticios para demostración.</span>
      </div>
    </div>
  );
};
