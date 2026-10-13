CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.roles (name, description)
VALUES
	('admin', 'Administrador local'),
	('veterinarian', 'Veterinario'),
	('owner', 'Propietario de mascotas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (name, description)
VALUES
	('CREATE_USER', 'Crear usuarios'),
	('READ_USER', 'Consultar usuarios'),
	('UPDATE_USER', 'Actualizar usuarios'),
	('DELETE_USER', 'Eliminar usuarios'),
	('CREATE_PET', 'Crear mascotas'),
	('READ_PET', 'Consultar mascotas'),
	('UPDATE_PET', 'Actualizar mascotas'),
	('DELETE_PET', 'Archivar mascotas'),
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
	('CREATE_PET_MEDICATION', 'Registrar tratamientos de mascotas'),
	('READ_PET_MEDICATION', 'Consultar tratamientos de mascotas'),
	('UPDATE_PET_MEDICATION', 'Actualizar tratamientos de mascotas'),
	('DELETE_PET_MEDICATION', 'Eliminar tratamientos de mascotas'),
	('CREATE_WEIGHT_RECORD', 'Registrar pesos'),
	('READ_WEIGHT_RECORD', 'Consultar pesos'),
	('CREATE_REMINDER', 'Crear recordatorios'),
	('READ_REMINDER', 'Consultar recordatorios'),
	('UPDATE_REMINDER', 'Actualizar recordatorios'),
	('DELETE_REMINDER', 'Eliminar recordatorios')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.users (name, email, password, role_id)
SELECT 'Admin Pawlife', 'admin@pawlife.local', crypt('Password123!', gen_salt('bf')), id
FROM public.roles WHERE name = 'admin'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (name, email, password, role_id)
SELECT 'Ana Ruiz', 'ana@pawlife.co', crypt('Password123!', gen_salt('bf')), id
FROM public.roles WHERE name = 'veterinarian'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (name, email, password, role_id)
SELECT 'Carlos Diaz', 'carlos@pawlife.co', crypt('Password123!', gen_salt('bf')), id
FROM public.roles WHERE name = 'owner'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM public.roles roles
CROSS JOIN public.permissions permissions
WHERE roles.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO public.veterinarians (user_id, license_number, specialty)
SELECT id, 'VET-001', 'Medicina general'
FROM public.users
WHERE email = 'ana@pawlife.co'
ON CONFLICT DO NOTHING;

INSERT INTO public.pets (name, species, breed, sex, birth_date, owner_id)
SELECT 'Luna', 'cat', 'Criollo', 'female', '2022-05-14', users.id
FROM public.users
WHERE users.email = 'carlos@pawlife.co'
	AND NOT EXISTS (
		SELECT 1 FROM public.pets WHERE name = 'Luna' AND owner_id = users.id
	);