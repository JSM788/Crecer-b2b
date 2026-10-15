export interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  children?: {
    title: string;
    href: string;
  }[];
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    title: "Inicio",
    href: "/inicio/",
    icon: "Home",
  },
  {
    title: "Comercial",
    href: "/comercial/clientes/",
    icon: "Briefcase",
    children: [
      {
        title: "Clientes",
        href: "/comercial/clientes/",
      },
      {
        title: "Visitas y jornadas",
        href: "/comercial/visitas-jornadas/",
      },
      {
        title: "Ventas",
        href: "/comercial/ventas/",
      },
      {
        title: "Solicitudes",
        href: "/comercial/solicitudes/",
      },
      {
        title: "Gastos",
        href: "/comercial/gastos/",
      },
    ],
  },
  {
    title: "Catálogo",
    href: "/catalogo/",
    icon: "BookOpen",
  },
  {
    title: "Inventario",
    href: "/inventario/",
    icon: "Package",
  },
  {
    title: "Finanzas",
    href: "/finanzas/",
    icon: "CircleDollarSign",
  },
  {
    title: "Reportes",
    href: "/reportes/",
    icon: "BarChart3",
  },
  {
    title: "Configuración",
    href: "/configuracion/",
    icon: "Settings",
  },
];
