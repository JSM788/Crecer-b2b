# Salinas · Guía del producto

Salinas coordina clientes, responsables y visitas de campo para distintas empresas. Esta guía cubre únicamente las funciones visibles verificadas por lectura del código al **31 de octubre de 2026**. No acredita una prueba completa en navegador o dispositivo.

## Entradas

**Visor interactivo:** [instrucciones de apertura](visor/README.md). En local se abre en `http://127.0.0.1:3003` después de ejecutar `pnpm dev` desde `docs/visor`.

| Para qué | Documento |
|---|---|
| Entender negocio, roles y conexiones | [Mapa del producto](mapa-producto.md) |
| Conocer el recorrido y las reglas | [Flujos visibles](flujos/recorridos.md) |
| Activación, recuperación y fechas de acceso | [Accesos](flujos/accesos.md) |
| Localizar implementación e investigar cambios | [Guía para agentes](agentes.md) |

El contenido explica procesos de negocio; no crea un diagrama por cada acción de listar, agregar o consultar. Los módulos ocultos y las maquetas iniciales no definen el producto futuro y quedan fuera del alcance.

## Fuente y evolución

La documentación central describe las conexiones entre web, móvil y backend. Cada repositorio conserva sus detalles técnicos, enlazados desde aquí. Mantener los identificadores F01, F02 y F03 para que el futuro visor pueda referenciarlos.

El visor interactivo local está en `visor/`. La publicación privada y las capturas paso a paso siguen pendientes. No se incluyen contraseñas, tokens ni información real de clientes.

Cuando cambie una función, contrastar su recorrido con el código y actualizar el documento afectado. La estructura y los nombres de los archivos técnicos pueden cambiar: verificar las referencias antes de usarlas.
