# Reglas funcionales confirmadas — Panel de Visitas

## Estados
- Estados persistidos: `pendiente`, `asignado`, `en_espera`, `confirmado`, `cancelado`, `duplicado`, `corregido`.
- `modificar` no es un estado de negocio: es solo un modo interno de edición para corregir datos del formulario ya cargado.
- No hay un flujo lineal obligatorio ni transiciones prohibidas.
- Flujo ideal: `asignado -> confirmado`, pero algunos casos pueden pasar directo a `confirmado` o quedar solo en `asignado`.

## Duplicación
- La duplicación existe para reutilizar una solicitud cuando en realidad derivará en más de una visita.
- Al duplicar, todos los campos se heredan al nuevo registro.
- Luego el operador edita el duplicado para cambiar institución, cantidad, día, horario u otros datos necesarios.
- Si una institución cambia de fecha, se conserva el mismo registro y debería mantenerse historial sobre ese registro.

## Cupo y semáforo
- El tope general por turno es 120.
- El semáforo se calcula por cupo firme.
- Los grupos en `en_espera` no deben bloquear la asignación, pero sí deben verse en la UI como señal de revisión.
- El semáforo es ayuda visual y no debe impedir asignar un turno.
- A futuro puede ser útil habilitar cupos específicos por día/turno.

## Validación
- Campos mínimos para operar: nombre de institución o referente, cantidad de personas y mail o teléfono de contacto.
- No hay reglas diferentes por tipo de institución.
- Se puede guardar borrador incompleto.
- En la práctica, la fuente original de datos ya tiene obligatorios, por lo que no se espera tanta falta de datos en esta app.

## Seguimiento
- La plantilla de asignación opera de hecho como confirmación inicial del turno.
- La plantilla de confirmación funciona como recordatorio / segunda comunicación.
- `confirmado` significa que hubo respuesta al recordatorio.
- Idealmente conviene registrar quién operó, pero no es un requisito bloqueante si no se completa.

## Usuarios
- Todos los usuarios actuales hacen lo mismo.
- Si más adelante se requieren permisos finos o roles distintos, se resolverá en una segunda app tomando esta como base.
