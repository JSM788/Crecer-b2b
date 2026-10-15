import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Users, Calendar, ShoppingBag, FileText, ArrowRight } from "lucide-react";

export default function InicioPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Panel General"
          subtitle="Bienvenido a la plataforma comercial B2B Aquamundo"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/comercial/clientes/">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-2xs text-zinc-400">Cartera de clientes</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">Clientes</p>
                  <p className="text-2xs text-zinc-500 mt-1">Gestión y asignaciones</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/comercial/visitas-jornadas/">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-2xs text-zinc-400">Rutas y campo</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">Visitas y jornadas</p>
                  <p className="text-2xs text-zinc-500 mt-1">Agenda, check-in y evidencias</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/comercial/ventas/">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-2xs text-zinc-400">Operaciones comerciales</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">Ventas</p>
                  <p className="text-2xs text-zinc-500 mt-1">Cotizaciones y pedidos</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/comercial/gastos/">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-2xs text-zinc-400">Rendiciones</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">Gastos</p>
                  <p className="text-2xs text-zinc-500 mt-1">Peajes, movilidad y viáticos</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
