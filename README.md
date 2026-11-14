# Rifa solidaria para Sixta Ferreira

Página estática para administrar la rifa desde un celular y exportar un afiche vertical actualizado para WhatsApp.

## Abrir y usar

Abrí `index.html` en un navegador moderno. Para que el almacenamiento local y la función de compartir funcionen con más consistencia, es preferible servir la carpeta desde un servidor estático o GitHub Pages.

- Elegí **Reservar**, **Marcar pagado** o **Liberar** y tocá los números.
- El progreso y el total recaudado cuentan solo los números pagados.
- **Descargar afiche PNG** genera una imagen vertical de 1080 × 1920. **Compartir afiche** usa la hoja de compartir del celular cuando el navegador la admite; en otros navegadores descarga el PNG.
- Usá **Guardar copia de datos** regularmente. La recuperación reemplaza el estado actual y pide confirmación.

## Datos y publicación

El estado se guarda en `localStorage` del navegador de este celular. No hay servidor, inicio de sesión ni sincronización: los compradores no verán automáticamente cambios hechos en otro dispositivo. Para mostrar números ocupados, compartí el PNG recién exportado.

Para publicar, subí el contenido de esta carpeta a un repositorio GitHub y habilitá Pages desde **Settings → Pages → Deploy from a branch**, seleccionando la rama y carpeta donde está `index.html`. Los archivos usan rutas relativas para admitir una página de proyecto (`usuario.github.io/repositorio/`). Al terminar la rifa, deshabilitá Pages o eliminá el repositorio si ya no querés mantener el sitio.

## Imágenes

Las fotos incluidas son las que se adjuntaron para el costillar, los chorizos y Sixta. La página y el afiche usan las fotos originales; el banner sintético `assets/premio-banner.jpg` queda en el proyecto pero no se usa en el afiche descargable.

## Diseño y tipografías

La dirección visual elegida es la de un volante familiar de rifa, con una cuadrícula clara, tinta verde oscura, el coral del vestido de Sixta y amarillo de talonario. La decisión está documentada en `docs/direccion-visual.md`.

Las fuentes Bree Serif y Atkinson Hyperlegible se sirven desde `assets/fonts/` para que la página y el afiche se vean igual en distintos dispositivos. Sus licencias OFL están incluidas junto a los archivos. La skill `frontend-design` usada como criterio está en `.agents/skills/frontend-design/` con su licencia y atribución.
