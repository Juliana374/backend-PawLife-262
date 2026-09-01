INSERT INTO users (name, email, password, role) VALUES
 ('Ana Ruiz', 'ana@pawlife.co', 'hash', 'veterinarian'),
 ('Carlos Diaz', 'carlos@pawlife.co', 'hash', 'owner')
ON CONFLICT (email) DO NOTHING;
INSERT INTO pets (name, species, breed, sex, birth_date, owner_id, vet_id)
VALUES ('Luna', 'cat', 'Criollo', 'female', '2022-05-14',
 (SELECT id FROM users WHERE email = 'carlos@pawlife.co'),
 (SELECT id FROM users WHERE email = 'ana@pawlife.co'));