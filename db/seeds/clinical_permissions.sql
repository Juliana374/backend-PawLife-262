INSERT INTO public.permissions (name, description)
VALUES
  ('CREATE_VETERINARIAN', 'Crear perfiles veterinarios'),
  ('READ_VETERINARIAN', 'Consultar perfiles veterinarios'),
  ('UPDATE_VETERINARIAN', 'Actualizar perfiles veterinarios'),
  ('CREATE_APPOINTMENT', 'Crear citas'),
  ('READ_APPOINTMENT', 'Consultar citas'),
  ('UPDATE_APPOINTMENT', 'Actualizar citas'),
  ('DELETE_APPOINTMENT', 'Eliminar citas'),
  ('CREATE_VACCINE', 'Registrar vacunas'),
  ('READ_VACCINE', 'Consultar vacunas'),
  ('UPDATE_VACCINE', 'Actualizar vacunas'),
  ('DELETE_VACCINE', 'Eliminar vacunas'),
  ('CREATE_MEDICATION', 'Registrar medicamentos'),
  ('READ_MEDICATION', 'Consultar medicamentos'),
  ('UPDATE_MEDICATION', 'Actualizar medicamentos'),
  ('DELETE_MEDICATION', 'Eliminar medicamentos'),
  ('CREATE_WEIGHT_RECORD', 'Registrar pesos'),
  ('READ_WEIGHT_RECORD', 'Consultar pesos'),
  ('CREATE_REMINDER', 'Crear recordatorios'),
  ('READ_REMINDER', 'Consultar recordatorios'),
  ('UPDATE_REMINDER', 'Actualizar recordatorios'),
  ('DELETE_REMINDER', 'Eliminar recordatorios')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM public.roles roles
JOIN public.permissions permissions ON permissions.name IN (
  'CREATE_VETERINARIAN',
  'READ_VETERINARIAN',
  'UPDATE_VETERINARIAN',
  'CREATE_APPOINTMENT',
  'READ_APPOINTMENT',
  'UPDATE_APPOINTMENT',
  'DELETE_APPOINTMENT',
  'CREATE_VACCINE',
  'READ_VACCINE',
  'UPDATE_VACCINE',
  'DELETE_VACCINE',
  'CREATE_MEDICATION',
  'READ_MEDICATION',
  'UPDATE_MEDICATION',
  'DELETE_MEDICATION',
  'CREATE_WEIGHT_RECORD',
  'READ_WEIGHT_RECORD',
  'CREATE_REMINDER',
  'READ_REMINDER',
  'UPDATE_REMINDER',
  'DELETE_REMINDER'
)
WHERE roles.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;
