"use client";

import React, { useState } from "react";
import { Droplets, Lock, User, AlertCircle } from "lucide-react";
import { useAuth, DEMO_PASSWORD } from "@/shared/lib/auth-context";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white shadow-sm mb-1">
            <Droplets className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950">Aquamundo</h1>
          <p className="text-xs text-zinc-500">
            Plataforma B2B de Gestión Comercial
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Usuario
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              icon={<User className="h-4 w-4" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Contraseña de acceso
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
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-2xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Contraseña incorrecta. Intenta con la clave demo.</span>
            </div>
          )}

          <Button type="submit" className="w-full h-10 font-semibold text-sm">
            Iniciar sesión
          </Button>
        </form>

        {/* Demo credentials hint */}
        <div className="pt-4 border-t border-zinc-100 text-center">
          <p className="text-2xs text-zinc-400">
            Acceso restringido para demostración
          </p>
          <p className="text-2xs font-mono text-zinc-600 mt-1">
            Clave: <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-semibold text-zinc-800">{DEMO_PASSWORD}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
