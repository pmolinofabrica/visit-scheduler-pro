# Plan: Botones de Editar, Eliminar y Duplicar (CRUD)

## Objetivos
Reimplementar las acciones de edición, eliminación y duplicación tanto en las **Solicitudes Pendientes** como en los **Turnos Confirmados** para facilitar la gestión de datos y evitar que los usuarios tengan que rellenar el formulario de Google.

## Cambios en ListaSolicitudes.tsx (Pendientes)
1. Agregar botones `Pencil`, `Copy`, y `Trash2` a cada tarjeta de solicitud (visibles on hover).
2. Definir props `onEdit(id)`, `onDelete(id)`, `onDuplicate(id)`.

## Cambios en PanelAsignar.tsx (Gestión de Pendientes)
1. Recibir los eventos desde `ListaSolicitudes`.
2. **Edición:** Abrir un `Dialog` con `FormModificacion` precargado con el mapeo inverso de `SolicitudPendiente` -> `AsignacionVisita`.
3. Al Guardar, realizar un `UPDATE` a la tabla `solicitudes` y refetch.
4. **Duplicación:** Al darle a copiar o "Guardar y duplicar", insertar un `INSERT` en la tabla `solicitudes` limpiando el ID, copiando todos sus campos editables.
5. **Eliminación:** Borrar el registro usando `DELETE` filtrando por UUID en la tabla `solicitudes`.

## Cambios en TablaConfirmados.tsx y TablaSeguimiento.tsx (Asignaciones)
1. Agregar botón `Copy` de duplicación rápida junto al de `Pencil` y `Trash`.
2. Implementar la duplicación rápida que crea un registro en `asignaciones_visita` pero lo descuelga del calendario (`id_plani: null`) dejándolo en estado "Pendiente".
