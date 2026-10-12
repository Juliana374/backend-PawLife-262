ALTER TABLE public.photos
  ADD COLUMN filename varchar(255),
  ADD COLUMN original_name varchar(255);

UPDATE public.photos
SET filename = regexp_replace(url, '^.*/', ''),
    original_name = regexp_replace(url, '^.*/', '')
WHERE filename IS NULL OR original_name IS NULL;

ALTER TABLE public.photos
  ALTER COLUMN filename SET NOT NULL,
  ALTER COLUMN original_name SET NOT NULL,
  ALTER COLUMN url DROP NOT NULL;