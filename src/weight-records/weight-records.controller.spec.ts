import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { WeightRecord } from './entities/weight-record.entity';
import { WeightRecordsController } from './weight-records.controller';
import { WeightRecordsService } from './weight-records.service';

describe('WeightRecordsController', () => {
  let controller: WeightRecordsController;
  let service: { create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock };

  const storedRecord = {
    id: 8,
    weightKg: 12.4,
    petId: 1,
    measurementDate: '2026-02-01',
  } as unknown as WeightRecord;

  const input = { weightKg: 12.4, petId: 1, measurementDate: '2026-02-01' };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedRecord),
      findAll: jest.fn().mockResolvedValue([storedRecord]),
      findOne: jest.fn().mockResolvedValue(storedRecord),
    };

    controller = await createControllerUnderTest(
      WeightRecordsController,
      WeightRecordsService,
      service,
    );
  });

  it('envuelve el registro creado en el envelope estándar', async () => {
    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result).toEqual({ status: 'ok', data: storedRecord });
  });

  it('pasa los filtros al servicio', async () => {
    const result = await controller.findAll({ petId: 1, from: '2026-01-01' });

    expect(service.findAll).toHaveBeenCalledWith({ petId: 1, from: '2026-01-01' });
    expect(result.data).toEqual([storedRecord]);
  });

  it('el petId de la ruta manda sobre el de la query', async () => {
    await controller.findByPet(7, { petId: 1 });

    expect(service.findAll).toHaveBeenCalledWith({ petId: 7 });
  });

  it('delega la consulta por ID', async () => {
    const result = await controller.findOne(8);

    expect(service.findOne).toHaveBeenCalledWith(8);
    expect(result.data).toBe(storedRecord);
  });
  it('limpia la contraseña del veterinario si la cita trae el usuario cargado', async () => {
    service.findOne.mockResolvedValue({
      ...storedRecord,
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

    const result = await controller.findOne(8);

    expectNoPassword(result);
    expect(
      (result.data as { appointment: { vet: { userId: number } } }).appointment.vet
        .userId,
    ).toBe(2);
  });
});
