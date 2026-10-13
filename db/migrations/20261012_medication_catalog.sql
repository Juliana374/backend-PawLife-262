CREATE TABLE IF NOT EXISTS public.medication_catalog (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  active_ingredient VARCHAR(120),
  concentration VARCHAR(50),
  presentation VARCHAR(100),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS medication_catalog_id INTEGER;

INSERT INTO public.medication_catalog (name)
SELECT DISTINCT BTRIM(treatment.name)
FROM public.medications treatment
WHERE NULLIF(BTRIM(treatment.name), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.medication_catalog catalog
    WHERE LOWER(BTRIM(catalog.name)) = LOWER(BTRIM(treatment.name))
  );

UPDATE public.medications treatment
SET medication_catalog_id = (
  SELECT catalog.id
  FROM public.medication_catalog catalog
  WHERE LOWER(BTRIM(catalog.name)) = LOWER(BTRIM(treatment.name))
  ORDER BY catalog.id
  LIMIT 1
)
WHERE treatment.medication_catalog_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.medications
    WHERE medication_catalog_id IS NULL
  ) THEN
    RAISE EXCEPTION 'No se puede exigir medication_catalog_id: hay tratamientos sin nombre de medicamento válido.';
  END IF;
END $$;

ALTER TABLE public.medications
  ALTER COLUMN medication_catalog_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'medications_medication_catalog_id_fkey'
      AND conrelid = 'public.medications'::regclass
  ) THEN
    ALTER TABLE public.medications
      ADD CONSTRAINT medications_medication_catalog_id_fkey
      FOREIGN KEY (medication_catalog_id)
      REFERENCES public.medication_catalog(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medications_medication_catalog_id
  ON public.medications (medication_catalog_id);

INSERT INTO public.permissions (name, description)
VALUES
  ('CREATE_PET_MEDICATION', 'Registrar tratamientos de mascotas'),
  ('READ_PET_MEDICATION', 'Consultar tratamientos de mascotas'),
  ('UPDATE_PET_MEDICATION', 'Actualizar tratamientos de mascotas'),
  ('DELETE_PET_MEDICATION', 'Eliminar tratamientos de mascotas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT existing.role_id, pet_permission.id
FROM public.role_permissions existing
JOIN public.permissions old_permission
  ON old_permission.id = existing.permission_id
JOIN (
  VALUES
    ('CREATE_MEDICATION', 'CREATE_PET_MEDICATION'),
    ('READ_MEDICATION', 'READ_PET_MEDICATION'),
    ('UPDATE_MEDICATION', 'UPDATE_PET_MEDICATION'),
    ('DELETE_MEDICATION', 'DELETE_PET_MEDICATION')
) AS permission_map(old_name, pet_name)
  ON permission_map.old_name = old_permission.name
JOIN public.permissions pet_permission
  ON pet_permission.name = permission_map.pet_name
ON CONFLICT (role_id, permission_id) DO NOTHING;