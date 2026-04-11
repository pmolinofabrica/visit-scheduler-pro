# Estado de Desarrollo y Progreso: Visit Scheduler Pro
**Fecha de actualización:** 10 de Abril de 2026

Este documento sirve como bitácora y resguardo del contexto de desarrollo, decisiones de arquitectura y estado funcional de la aplicación. 

## Contexto Inicial y Entorno
* **Repositorio de Trabajo:** `/home/pablo/Documentos/visit-scheduler-pro`
* Tras un reinicio del sistema, se confirmó que el código fuente local estaba intacto.
* **Base de datos:** Se utiliza **Supabase** de manera local. Las migraciones requeridas (incluyendo las tablas base `solicitudes` y `asignaciones_visita`, vistas como `vista_disponibilidad_visitas` y configuraciones) han sido desplegadas y el CLI de Supabase responde correctamente a la instancia. 
* El frontend se ejecuta a través de Node/Vite (`npm run dev`).

## Desarrollo de Flujo Principal (CRUD y Seguimiento)

El objetivo principal de esta iteración de trabajo fue estabilizar y unificar la lógica de gestión (CRUD: Crear, Leer, Actualizar, Borrar) tanto para las **solicitudes que provienen de Google Forms** como para las **asignaciones agendadas** para visitas a establecimientos.

### 1. Panel Asignar y Lista de Solicitudes
* **Conexión Real Restablecida:** El hook `useSolicitudesPendientes` (en `src/hooks/useVisitas.ts`) está testeado y funcional. Filtra correctamente las peticiones que ingresaron con el estado base `pendiente` (case-insensitive) y únicamente del año calendario actual.
* **CRUD en Tarjetas:** En `ListaSolicitudes.tsx` se integró la funcionalidad de `Hover actions`. Cada tarjeta de solicitud pendiente cuenta con íconos para **Editar, Duplicar y Eliminar**.
* Las acciones impactan directamente a la tabla `solicitudes` a través de Supabase.

### 2. Acciones Rápidas en Calendario (`PanelAsignar.tsx`)
Cuando el usuario presiona un recuadro coloreado del calendario (Turno ocupado), el panel derecho expone los detalles junto a 4 botones vitales que gestionan la tabla `asignaciones_visita`:
1. **Pencil (Editar):** Abre un formulario popup con los datos de campo para editarlos y hacer UPDATE sin moverlo de día/horario.
2. **ArrowDownAZ (A Pendiente):** Devuelve esa asignación al estado `pendiente` y, críticamente, **limpia el `id_plani` (establece `null`)** liberando el cupo del calendario en tiempo real.
3. **Copy (Duplicar):** Aplica la lógica *DAMA* que solicitó el usuario. Crea una nueva solicitud en base a un turno existente con el objetivo de evitar que el operador pida que le re-llenen un Formulario de Google por falta de cupo.
   * **Flujo Implementado:** Al dar a duplicar, **se abre en pantalla completa el formulario**. El operador modifica lo necesario e interactúa con un botón exclusivo que dice **"Guardar Nuevo Duplicado"**. Termina insertando un registro nuevo en BD.
4. **Trash (Eliminar):** Borrado físico del calendario de visitas tras confirmación.

### 3. Seguimiento Unificado (`TablaSeguimiento.tsx`)
Se resolvió la discrepancia de visibilidad. Anteriormente, los filtros "Pendientes" dentro de la sección "Seguimiento" no mostraban las solicitudes base provenientes de Google Forms, sino solo las que habían sido asignadas y luego revertidas.
* **Fusión de Datos:** Se combinó la extracción de `useAsignaciones` con `useSolicitudesPendientes`. 
* Se emuló un mapeo de estructura para inyectar estos registros base. 
* Visualmente se diferencian mostrando una clave `#F` (Formulario) en vez del usual `#ID` numérico.
* La línea de tiempo, observaciones y envío de correos sobre estos registros están controlados y encapsulados.

## Decisiones de Arquitectura Tomadas en Conjunto

Durante el desarrollo, surgió la duda sobre la viabilidad de enviar transacciones constantes (Round-Trips) hacia la base de datos local por cada simple cambio de estado.

**Resolución de Arquitectura Local:**
Se planteó un esquema de "Carrito/Commit" utilizando un control de Estado Global (como Context o Zustand), que aglutinara los cambios a nivel local y solo mandara consultas masivas (Lotes/Batch) al darle a "Guardar todo". 

**Sin embargo:**
El usuario confirmó que **el entorno de acceso concurrente será casi nulo** (máximo 3-4 personas, y rara vez modificando los mismos eventos en simultáneo). Por lo tanto:
> Se decidió **continuar con el enfoque reactivo y atómico**. Es decir, la Interfaz de Usuario emite eventos mutantes (`INSERT`, `UPDATE`, `DELETE`) al presionar los respectivos botones, disparando llamadas optimistas y reflejando los cambios enseguida vía revalidación y cache de React Query (`qc.invalidateQueries()`). 

Esto simplifica el código, evita conflictos lógicos colosales de estados paralelos y mantiene sincronizada la base de datos postgress sin fallos de desincronización, priorizando la mantenibilidad del código base local.

---

## Últimas Refinaciones de Estabilización (11 de Abril de 2026)

Se realizaron ajustes finales para garantizar la integridad de los datos y mejorar la experiencia de búsqueda:

### 1. Re-asignación en Edición
* Se agregó un selector de **🗓️ Fecha y Horario** dentro del formulario de edición. Esto permite que, al corregir datos de una institución ya asignada, se pueda cambiar su turno (id_plani) en el mismo paso sin tener que borrar y volver a asignar.

### 2. Filtros y Búsqueda en Seguimiento
* **Filtro de Múltiples Visitas:** Se implementó una lógica que agrupa y muestra solo las instituciones que tienen más de un registro (original + copias), útil para detectar duplicidades o visitas recurrentes de una misma escuela.
* **Buscador Universal:** Se añadió una barra de búsqueda en tiempo real que filtra por nombre de institución, referente o fecha de visita.

### 3. Integridad de Base de Datos (Fix de Registros Fantasma)
* Se corrigió un bug crítico donde los botones "A Pendiente" y "Duplicar" dejaban registros huérfanos sin fecha en la tabla de asignaciones. 
* **Nueva Lógica:** Ahora, estas acciones mueven/clonan los datos limpiamente hacia la tabla de `solicitudes` y eliminan el rastro de la tabla de asignaciones, manteniendo el Seguimiento libre de "registros fantasma".

---

### Siguiente Paso Lógico al Retomar el Sistema
- Monitorear la carga de datos desde Google Forms para asegurar que el volumen de 300+ registros se maneje con fluidez con el nuevo buscador.
- Verificar la correcta visualización de los sufijos (Copia #...) en reportes impresos si se requiere.
