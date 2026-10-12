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

Las fotos ya se reciben desde el controlador de mascotas y se guardan en `uploads/`; no crear un módulo de fotos separado mientras ese flujo sea suficiente.

## Pasos por recurso

1. Añadir DTOs con validaciones del esquema, mensajes de error en español para cada validador y `PartialType` para actualización.
2. Crear servicio con las operaciones necesarias, relaciones y `NotFoundException`; mantenerlo enfocado en datos.
3. Crear controlador CRUD con guards, permiso por operación, Swagger y envelope estándar.
4. Crear módulo con `TypeOrmModule.forFeature`, importar `AuthModule` y registrarlo en `AppModule`.
5. Añadir los permisos al enum y asignarlos a los roles en la base de datos.
6. Documentar cada endpoint nuevo o modificado en `docs/pawlife-api.postman_collection.json`.
7. Validar DTOs, permisos, relaciones, respuesta sin secretos y errores de recurso inexistente.

## Convenciones HTTP

- Crear: `POST`, `201`, `{ status: 'ok', data: recurso }`.
- Listar/obtener/actualizar: `GET`/`PATCH`, `200`, `{ status: 'ok', data: recurso(s) }`.
- Eliminar: `DELETE`, `200`, `{ status: 'ok', data: null }`.
- Errores: usar excepciones NestJS y documentar las respuestas con Swagger.
- Cada endpoint debe figurar en la colección Postman con método, ruta, autenticación/permisos, parámetros, ejemplo de body cuando aplique y respuesta esperada.
- Usar filtros sencillos por relación cuando sean necesarios; evitar paginación, repositorios genéricos o abstracciones hasta que el volumen lo requiera.

## Criterios de cierre

- El módulo respeta las columnas, enums, constraints y relaciones del SQL.
- El controlador aplica los permisos adecuados y no expone passwords ni otros datos sensibles.
- El servicio no construye respuestas HTTP.
- Todos los validadores de DTO deben definir mensajes de error claros en español; los DTOs de actualización deben heredarlos de su DTO base.
- Swagger refleja multipart cuando haya archivos y el envelope estándar en respuestas exitosas.
- La colección Postman está actualizada con todos los endpoints del módulo.
- Los diagnósticos y pruebas del módulo pasan; verificar además que la app compile.
- Swagger refleja multipart cuando haya archivos y el envelope estándar en respuestas exitosas.
- La colección Postman está actualizada con todos los endpoints del módulo.
- Los diagnósticos y pruebas del módulo pasan; verificar además que la app compile.
