import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { Vaccine } from './entities/vaccine.entity';
import { VaccinesController } from './vaccines.controller';
import { VaccinesService } from './vaccines.service';

describe('VaccinesController', () => {
  let controller: VaccinesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const storedVaccine = {
    id: 3,
    name: 'Rabia',
    petId: 1,
    applicationDate: '2026-02-01',
  } as unknown as Vaccine;

  const input = { name: 'Rabia', petId: 1, applicationDate: '2026-02-01' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedVaccine),
      findAll: jest.fn().mockResolvedValue([storedVaccine]),
      findOne: jest.fn().mockResolvedValue(storedVaccine),
      update: jest.fn().mockResolvedValue(storedVaccine),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    controller = await createControllerUnderTest(
      VaccinesController,
      VaccinesService,
      service,
    );
  });

  it('envuelve la vacuna creada en el envelope estándar', async () => {
    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result).toEqual({ status: 'ok', data: storedVaccine });
  });

  it('pasa los filtros al servicio', async () => {
    const result = await controller.findAll({ petId: 1, from: '2026-01-01' });

    expect(service.findAll).toHaveBeenCalledWith({ petId: 1, from: '2026-01-01' });
    expect(result.data).toEqual([storedVaccine]);
  });

  it('el petId de la ruta manda sobre el de la query', async () => {
    await controller.findByPet(7, { petId: 1, from: '2026-01-01' });

    expect(service.findAll).toHaveBeenCalledWith({ petId: 7, from: '2026-01-01' });
  });

  it('delega la consulta por ID', async () => {
    const result = await controller.findOne(3);

    expect(service.findOne).toHaveBeenCalledWith(3);
    expect(result.data).toBe(storedVaccine);
  });

  it('delega la actualización', async () => {
    const result = await controller.update(3, { name: 'Rabia refuerzo' });

    expect(service.update).toHaveBeenCalledWith(3, { name: 'Rabia refuerzo' });
    expect(result.status).toBe('ok');
  });

  it('responde con data en null al eliminar', async () => {
    const result = await controller.remove(3);

    expect(service.remove).toHaveBeenCalledWith(3);
    expect(result).toEqual({ status: 'ok', data: null });
  });
  it('limpia la contraseña del veterinario si la cita trae el usuario cargado', async () => {
    service.findOne.mockResolvedValue({
      ...storedVaccine,
      appointment: {
        id: 5,
        vet: {
          userId: 2,
          user: {
            id: 2,
            name: 'Ana Gómez',
            email: 'ana@pawlife.com',
            password: 'hash-guardado',
          },
        },
      },
    });

    const result = await controller.findOne(3);

    expectNoPassword(result);
    expect(
      (result.data as { appointment: { vet: { userId: number } } }).appointment.vet
        .userId,
    ).toBe(2);
  });
});
