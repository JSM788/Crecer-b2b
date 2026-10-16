"use client";

import React, { useState } from "react";
import { Droplets, Lock, User, AlertCircle, ShieldCheck, DollarSign, Briefcase } from "lucide-react";
import { useAuth } from "@/shared/lib/auth-context";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("gerencia");
  const [password, setPassword] = useState("gerencia123");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError(true);
    }
  };

  const handleSelectDemoUser = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-xl shadow-lg p-6 sm:p-7 space-y-4">
        {/* Brand */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#27272a] text-white shadow-sm mb-1">
            <Droplets className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950">Aquamundo</h1>
          <p className="text-xs text-zinc-500">
            Plataforma B2B Web Back-Office
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Usuario
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
              }}
              placeholder="gerencia, finanzas u operaciones"
              icon={<User className="h-4 w-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-2xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Credenciales incorrectas. Selecciona una cuenta demo abajo.</span>
            </div>
          )}

          <Button type="submit" className="w-full h-9 font-semibold text-xs bg-[#27272a] hover:bg-zinc-800 text-white rounded-lg">
            Ingresar al sistema
          </Button>
        </form>

        {/* Demo profiles quick selector */}
        <div className="pt-3 border-t border-zinc-100">
          <p className="text-[11px] font-medium text-zinc-500 text-center mb-2">
            Perfiles de acceso demostrativo:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectDemoUser("gerencia", "gerencia123")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                username === "gerencia" || username === "admin"
                  ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/10"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-800" />
                <span className="text-2xs font-bold text-zinc-900">Gerencia</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoUser("finanzas", "finanzas123")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                username === "finanzas"
                  ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/10"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-2xs font-bold text-zinc-900">Finanzas</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoUser("operaciones", "operaciones123")}
              className={`p-2 rounded-lg border text-center transition-colors ${
                username === "operaciones"
                  ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/10"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-2xs font-bold text-zinc-900">Operaciones</span>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 text-center mt-2">
            Usa el selector para cargar usuario y contraseña automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
