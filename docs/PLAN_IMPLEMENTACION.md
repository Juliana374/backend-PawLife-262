# Plan de implementación

## Arquitectura a conservar

- Un módulo NestJS por recurso, registrado en `AppModule`.
- Cada módulo contiene `controller`, `service` y DTOs `create`/`update`; reutiliza las entidades actuales.
- El controlador recibe y valida la petición, aplica guards/permisos, documenta con Swagger y construye `{ status: 'ok', data }`.
- El servicio contiene las operaciones TypeORM y reglas de negocio. Devuelve datos, no arma el envelope HTTP.
- Los endpoints protegidos reutilizan `JwtAuthGuard`, `PermissionsGuard`, `RequirePermissions` y `AppPermission` desde `AuthModule`.
- No añadir capas ni abstracciones compartidas salvo que un caso real las necesite. Mantener `synchronize: false` y tratar el SQL como fuente del esquema.

## Orden de trabajo

1. **Veterinarios**: crear perfil asociado a un usuario. Permitir obtener y actualizar el perfil; respetar la FK a `users`.
2. **Citas**: CRUD básico con relación a mascota y veterinario. Validar estados y fechas; permitir consultar por mascota o veterinario.
3. **Vacunas**: registrar y consultar por mascota, con cita y veterinario opcionales.
4. **Medicamentos**: CRUD con estado, fechas de inicio/fin y relaciones opcionales a cita y veterinario.
5. **Pesos**: registrar y consultar mediciones por mascota, opcionalmente asociadas a una cita.
6. **Recordatorios**: CRUD y actualización de `completed`; relacionar la mascota y el usuario creador.
7. **Fotos**: gestionar carga, consulta, metadatos y eliminación de fotos asociadas a mascotas, reutilizando la entidad y el almacenamiento existentes.

## Pasos por recurso

1. Añadir DTOs con validaciones del esquema y `PartialType` para actualización.
2. Crear servicio con las operaciones necesarias, relaciones y `NotFoundException`; mantenerlo enfocado en datos.
3. Crear controlador CRUD con guards, permiso por operación, Swagger y envelope estándar.
4. Crear módulo con `TypeOrmModule.forFeature`, importar `AuthModule` y registrarlo en `AppModule`.
5. Añadir los permisos al enum y asignarlos a los roles en la base de datos.
6. Validar DTOs, permisos, relaciones, respuesta sin secretos y errores de recurso inexistente.

## Convenciones HTTP

- Crear: `POST`, `201`, `{ status: 'ok', data: recurso }`.
- Listar/obtener/actualizar: `GET`/`PATCH`, `200`, `{ status: 'ok', data: recurso(s) }`.
- Eliminar: `DELETE`, `200`, `{ status: 'ok', data: null }`.
- Errores: usar excepciones NestJS y documentar las respuestas con Swagger.
- Usar filtros sencillos por relación cuando sean necesarios; evitar paginación, repositorios genéricos o abstracciones hasta que el volumen lo requiera.

## Criterios de cierre

- El módulo respeta las columnas, enums, constraints y relaciones del SQL.
- El controlador aplica los permisos adecuados y no expone passwords ni otros datos sensibles.
- El servicio no construye respuestas HTTP.
- Swagger refleja multipart cuando haya archivos y el envelope estándar en respuestas exitosas.
- Fotos conserva la validación de imágenes y el almacenamiento estático en `uploads/`; borrar una foto elimina también su archivo.
- Los diagnósticos y pruebas del módulo pasan; verificar además que la app compile.
