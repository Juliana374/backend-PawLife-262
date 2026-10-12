ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_pet_id_fkey;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_pet_id_fkey
  FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE RESTRICT;

ALTER TABLE public.vaccines
  DROP CONSTRAINT IF EXISTS vaccines_vet_id_fkey,
  DROP COLUMN IF EXISTS vet_id,
  DROP CONSTRAINT IF EXISTS vaccines_pet_id_fkey;
ALTER TABLE public.vaccines
  ADD CONSTRAINT vaccines_pet_id_fkey
  FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE RESTRICT;

ALTER TABLE public.medications
  DROP CONSTRAINT IF EXISTS medications_vet_id_fkey,
  DROP COLUMN IF EXISTS vet_id,
  DROP CONSTRAINT IF EXISTS medications_pet_id_fkey;
ALTER TABLE public.medications
  ADD CONSTRAINT medications_pet_id_fkey
  FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE RESTRICT;

ALTER TABLE public.weight_records
  DROP CONSTRAINT IF EXISTS weight_records_vet_id_fkey,
  DROP COLUMN IF EXISTS vet_id,
  DROP CONSTRAINT IF EXISTS weight_records_pet_id_fkey;
ALTER TABLE public.weight_records
  ADD CONSTRAINT weight_records_pet_id_fkey
  FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE RESTRICT;

ALTER TABLE public.weight_records
  ADD CONSTRAINT weight_records_measurement_date_not_future
  CHECK (measurement_date <= CURRENT_DATE);