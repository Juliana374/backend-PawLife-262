import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { Pet, PetSpecies } from './entities/pet.entity';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

describe('PetsController', () => {
  let controller: PetsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const storedPet = {
    id: 1,
    name: 'Luna',
    species: PetSpecies.DOG,
    active: true,
    owner: {
      id: 2,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      password: 'hash-guardado',
    },
    photos: [{ id: 5, filename: 'luna 1.jpg', originalName: 'foto1.jpg' }],
  } as unknown as Pet;

  const input = { name: 'Luna', species: PetSpecies.DOG, ownerId: 2 };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedPet),
      findAll: jest.fn().mockResolvedValue([storedPet]),
      findOne: jest.fn().mockResolvedValue(storedPet),
      update: jest.fn().mockResolvedValue(storedPet),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    controller = await createControllerUnderTest(
      PetsController,
      PetsService,
      service,
    );
  });

  it('quita la contraseña del propietario', async () => {
    const result = await controller.create(input, []);

    expect(result.status).toBe('ok');
    expectNoPassword(result);
    expect(result.data).toEqual(
      expect.objectContaining({
        owner: { id: 2, name: 'Ana Gómez', email: 'ana@pawlife.com' },
      }),
    );
  });

  it('traduce los archivos de multer al formato del servicio', async () => {
    await controller.create(input, [
      { filename: 'luna-1.jpg', originalname: 'foto1.jpg' },
      { filename: 'luna-2.jpg', originalname: 'foto2.jpg' },
    ] as never);

    expect(service.create).toHaveBeenCalledWith(input, [
      { filename: 'luna-1.jpg', originalName: 'foto1.jpg' },
      { filename: 'luna-2.jpg', originalName: 'foto2.jpg' },
    ]);
  });

  it('expone las fotos como URL y no como nombre de archivo', async () => {
    const result = await controller.findOne(1);
    const [photo] = (result.data as { photos: Record<string, unknown>[] }).photos;

    expect(photo).not.toHaveProperty('filename');
    expect(photo.url).toBe('/uploads/luna%201.jpg');
    expect(photo.originalName).toBe('foto1.jpg');
  });

  it('no falla cuando la mascota llega sin propietario cargado', async () => {
    service.findOne.mockResolvedValue({ ...storedPet, owner: undefined });

    const result = await controller.findOne(1);

    expect(result.status).toBe('ok');
    expect((result.data as { owner?: unknown }).owner).toBeUndefined();
  });

  it('quita la contraseña de cada mascota del listado', async () => {
    const result = await controller.findAll({ ownerId: 2 });

    expect(service.findAll).toHaveBeenCalledWith({ ownerId: 2 });
    expect(Array.isArray(result.data)).toBe(true);
    expectNoPassword(result);
  });

  it('pasa las fotos nuevas al actualizar', async () => {
    await controller.update(1, { name: 'Nala' }, [
      { filename: 'nala.jpg', originalname: 'nala.jpg' },
    ] as never);

    expect(service.update).toHaveBeenCalledWith(1, { name: 'Nala' }, [
      { filename: 'nala.jpg', originalName: 'nala.jpg' },
    ]);
  });

  it('responde con data en null al eliminar', async () => {
    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ status: 'ok', data: null });
  });
});
