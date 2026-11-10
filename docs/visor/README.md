# Visor visual de Salinas

Sitio Astro estático que presenta los procesos visibles de web y móvil. Lee los documentos Markdown centrales durante la compilación; no necesita la API ni la base de datos.

## Abrir localmente

Desde esta carpeta:

```sh
pnpm install
pnpm dev
```

Abrir `http://127.0.0.1:3003`. La navegación, búsqueda y selección de bloques funcionan dentro del visor. El enlace compartido conserva proceso y paso; una dirección local solo es accesible desde la computadora que lo ejecuta.

## Generar para publicar

```sh
pnpm build
pnpm preview
```

`dist/` contiene el sitio estático. La publicación privada requiere control de acceso en el alojamiento. La etiqueta «Documentación interna» y `noindex` no autentican ni protegen el contenido. El servidor local se limita a `127.0.0.1`.

## Fuentes y mantenimiento

- `../mapa-producto.md`: negocio, actores y reglas compartidas.
- `../flujos/recorridos.md`: explicación y reglas de F01, F02 y F03.
- `../agentes.md`: referencias técnicas y entrada de investigación.
- `src/scripts/guide.js`: solo navegación, etiquetas y geometría del mapa; extrae explicaciones, impacto y referencias del HTML generado desde Markdown.
- `src/styles/guide.css`: presentación y adaptación a pantallas pequeñas.

Si cambian identificadores F01–F03, títulos de secciones o cantidad/orden de pasos, actualizar sus referencias en el visor. No duplicar la explicación de negocio dentro del JavaScript. Las capturas reales quedan pendientes; no se muestran capturas ficticias ni se publican módulos ocultos.

El visor permite mapa general, procesos detallados, lectura documental, búsqueda, panel de impacto y referencias IA, navegación con historial/enlaces, zoom, ajuste, impresión y pantalla completa cuando el navegador la permite.
