import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansController } from './veterinarians.controller';
import { VeterinariansService } from './veterinarians.service';

describe('VeterinariansController', () => {
  let controller: VeterinariansController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  const veterinarian = {
    userId: 1,
    licenseNumber: 'MV-1234',
    specialty: 'Cirugía',
    user: {
      id: 1,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      password: 'hash-guardado',
    },
  } as unknown as Veterinarian;

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(veterinarian),
      findAll: jest.fn().mockResolvedValue([veterinarian]),
      findOne: jest.fn().mockResolvedValue(veterinarian),
      update: jest.fn().mockResolvedValue(veterinarian),
    };

    controller = await createControllerUnderTest(
      VeterinariansController,
      VeterinariansService,
      service,
    );
  });

  it('devuelve el envelope estándar sin la contraseña del usuario', async () => {
    const input = { userId: 1, licenseNumber: 'MV-1234', specialty: 'Cirugía' };

    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result.status).toBe('ok');
    expectNoPassword(result);
    expect(result.data).toEqual({
      userId: 1,
      licenseNumber: 'MV-1234',
      specialty: 'Cirugía',
      user: { id: 1, name: 'Ana Gómez', email: 'ana@pawlife.com' },
    });
  });

  it('quita la contraseña de cada elemento del listado', async () => {
    const result = await controller.findAll({ specialty: 'cirugía' });

    expect(service.findAll).toHaveBeenCalledWith({ specialty: 'cirugía' });
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toEqual([
      expect.objectContaining({
        user: expect.not.objectContaining({ password: expect.anything() }),
      }),
    ]);
  });

  it('delega la búsqueda por ID de usuario al servicio', async () => {
    const result = await controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result.status).toBe('ok');
  });

  it('delega la actualización al servicio', async () => {
    const input = { specialty: 'Dermatología' };

    const result = await controller.update(1, input);

    expect(service.update).toHaveBeenCalledWith(1, input);
    expect(result.status).toBe('ok');
  });
});
