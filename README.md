# Aquamundo — Plataforma B2B Comercial (Crecer B2B)

Maqueta frontend navegable de alta fidelidad visual y arquitectura limpia para plataforma B2B de gestión comercial. Desarrollada siguiendo las especificaciones del brief técnico y las capturas de diseño de referencia.

---

## 🚀 Despliegue en Vivo (GitHub Pages)

* **URL del Sitio:** [https://jsm788.github.io/Crecer-b2b/](https://jsm788.github.io/Crecer-b2b/)
* **Credenciales de Acceso (Login Protector):**
  * **Usuario:** `admin`
  * **Contraseña:** `aquamundo2026`

---

## 🏛️ Arquitectura del Proyecto

El código está estructurado bajo **principios de Arquitectura Limpia y Modularidad por Dominio**, garantizando desacoplamiento, mantenibilidad y escalabilidad hacia un sistema real:

```text
src/
├── app/                             # SOLO Routing y composición de páginas (Next.js App Router)
│   ├── layout.tsx                   # Layout raíz con AuthProvider
│   ├── login/                       # Pantalla de Login protector
│   ├── comercial/
│   │   ├── clientes/                # Cartera y Asignaciones (C09 Ficha cliente)
│   │   ├── visitas-jornadas/        # Agenda (C01), Jornadas (C02), Registros (C03), Detalle (C14), Activa (C15)
│   │   ├── ventas/                  # Cotizaciones (C04, C10, C12) y Pedidos (C05, C11, C13)
│   │   ├── solicitudes/             # Visitas extraordinarias (C06) y Material POP (C07)
│   │   └── gastos/                  # Rendición de gastos de campo (C08)
│   └── (otros módulos)/             # Inicio, Catálogo, Inventario, Finanzas, Reportes, Configuración
│
├── modules/                         # LÓGICA DE DOMINIO Y NEGOCIO (Desacoplada)
│   ├── comercial/
│   │   ├── clientes/                # adapters, components, models, services, index.ts (Public API)
│   │   ├── visitas-jornadas/        # adapters, components, models, services, index.ts (Public API)
│   │   ├── ventas/                  # adapters, components, models, services, index.ts (Public API)
│   │   ├── solicitudes/             # adapters, components, models, services, index.ts (Public API)
│   │   └── gastos/                  # adapters, components, models, services, index.ts (Public API)
│
├── shared/                          # COMPONENTES Y UTILIDADES AGNÓSTICAS AL NEGOCIO
│   ├── components/ui/               # Button, Badge, Input, Select, Tabs, Card, SideDrawer, Modal
│   ├── patterns/                    # Header, Sidebar, PageHeader, FilterBar, DataTable, EmptyState
│   ├── layout/                      # DashboardShell con watermark de datos ficticios
│   ├── lib/                         # utils (cn, formatCurrency), auth-context
│   └── types/                       # PaginationState, BadgeVariant, BreadcrumbItem
│
├── config/                          # Menú de navegación centralizado
└── mocks/                           # Datasets simulados coherentes e interconectados
```

---

## 📱 Mapa de Pantallas Implementadas

| Código | Pantalla | Ruta | Características destacadas |
| :--- | :--- | :--- | :--- |
| **—** | **Clientes — Cartera** | `/comercial/clientes/` | Filtros por distrito, búsqueda por RUC, drawer lateral de *Más filtros*. |
| **—** | **Clientes — Asignaciones** | `/comercial/clientes/` | Selección múltiple con checkboxes, barra flotante inferior y drawer *Asignar vendedor*. |
| **C09** | **Ficha del Cliente** | `/comercial/clientes/cl-001/` | Métricas SAP, gráfico de compras de 6 meses y actividad reciente con enlace a pago. |
| **C01** | **Agenda** | `/comercial/visitas-jornadas/` | Franjas horarias 08:00 a 17:00, citas programadas y próximas visitas. |
| **C02** | **Jornadas** | `/comercial/visitas-jornadas/` | KPI cards (4 activas, 2 pendientes), banner de alerta y barras de avance por vendedor. |
| **C03** | **Registros de visita** | `/comercial/visitas-jornadas/` | Historial de visitas, badges de resultado y acceso a drawer de detalle. |
| **C14** | **Detalle de Jornada** | `/comercial/visitas-jornadas/jornada/j-01/` | Itinerario de 5 paradas, mapa interactivo, último evento y timeline cronológico. |
| **C15** | **Visita Activa y Cierre** | `/comercial/visitas-jornadas/visita-activa/` | Información de crédito SAP, preguntas de verificación, toma de foto y botón de cierre. |
| **C18** | **Programar Visita** (Drawer) | *Desde Agenda* | Selector de territorio, objetivo y alerta de fuera de zona. |
| **C19** | **Registro de Visita** (Drawer) | *Desde Registros* | Coordenadas GPS con precisión, 2 fotos registradas y pedido vinculado. |
| **C04** | **Cotizaciones** | `/comercial/ventas/` | Tabla con estados (*Borrador, Enviada, Aprobada*), filtros y enlace a detalle. |
| **C05** | **Pedidos** | `/comercial/ventas/` | Tabla con estados de pago y reserva SAP (*Pendiente, Conciliado, Confirmada*). |
| **C10** | **Nueva Cotización** | `/comercial/ventas/cotizaciones/nueva/` | Formulario, tabla dinámica de productos y cálculo automático. |
| **C17** | **Seleccionar Productos** (Modal) | *Desde Nueva cotización* | Catálogo emergente con stock en tiempo real, búsqueda y selector de cantidades. |
| **C11** | **Nuevo Pedido** | `/comercial/ventas/pedidos/nuevo/` | Validación de unidades aceptadas, aviso de demanda no atendida y condiciones de pago. |
| **C12** | **Detalle de Cotización** | `/comercial/ventas/cotizaciones/cot-1042/` | Resumen comercial, previsualización de PDF estilo Aquamundo y notas de stock. |
| **C13** | **Detalle del Pedido** | `/comercial/ventas/pedidos/ped-1042/` | Tarjetas de estado (pago, reserva SAP, validación), timeline y botón *Reportar pago*. |
| **C16** | **Reportar Pago** (Drawer) | *Desde Detalle de pedido* | Cuentas bancarias (BCP, etc.), monto, número de operación y dropzone de comprobante. |
| **C06** | **Visitas Extraordinarias** | `/comercial/solicitudes/` | Tabla con motivos de territorio y drawer de revisión gerencial. |
| **C07** | **Material POP** | `/comercial/solicitudes/` | Tabla de solicitudes de exhibidores y afiches clasificados por marca. |
| **C20** | **Solicitar Visita** (Drawer) | *Desde Solicitudes* | Justificación comercial y fecha/hora propuesta. |
| **C21** | **Solicitar Material POP** (Drawer) | *Desde Solicitudes* | Selección de marca (Bravery, etc.), material, cantidad y foto de referencia. |
| **C22** | **Revisar Solicitud** (Drawer) | *Desde Solicitudes* | Formulario gerencial para Aprobar o Rechazar con observaciones obligatorias. |
| **C08** | **Gastos de Campo** | `/comercial/gastos/` | KPI cards (*Por revisar S/ 85, Revisados S/ 120*), filtros de categoría y tabla. |
| **C23** | **Registrar Gasto** (Drawer) | *Desde Gastos* | Selección de jornada, categoría (peaje, etc.), RUC y foto del comprobante. |
| **C24** | **Detalle de Gasto** (Drawer) | *Desde Gastos* | Ficha con comprobante de peaje impreso e historial de auditoría. |

---

## 🛠️ Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

3. Compilar para producción (Export estático para GitHub Pages):
   ```bash
   npm run build
   ```
   Genera la carpeta `./out` lista para ser servida en cualquier hosting estático.

---

## 📦 Despliegue hacia GitHub

Para subir el proyecto a tu repositorio remoto y activar GitHub Actions:
```powershell
.\deploy-github.ps1
```
