import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { Medication, MedicationStatus } from './entities/medication.entity';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';

describe('MedicationsController', () => {
  let controller: MedicationsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const storedMedication = {
    id: 4,
    name: 'Amoxicilina',
    dose: '250 mg',
    status: MedicationStatus.ACTIVE,
    petId: 1,
  } as unknown as Medication;

  const input = {
    name: 'Amoxicilina',
    dose: '250 mg',
    schedule: 'Cada 12 horas',
    petId: 1,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedMedication),
      findAll: jest.fn().mockResolvedValue([storedMedication]),
      findOne: jest.fn().mockResolvedValue(storedMedication),
      update: jest.fn().mockResolvedValue(storedMedication),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    controller = await createControllerUnderTest(
      MedicationsController,
      MedicationsService,
      service,
    );
  });

  it('envuelve el medicamento creado en el envelope estándar', async () => {
    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result).toEqual({ status: 'ok', data: storedMedication });
  });

  it('pasa los filtros al servicio', async () => {
    const result = await controller.findAll({
      petId: 1,
      status: MedicationStatus.ACTIVE,
    });

    expect(service.findAll).toHaveBeenCalledWith({
      petId: 1,
      status: MedicationStatus.ACTIVE,
    });
    expect(result.data).toEqual([storedMedication]);
  });

  it('el petId de la ruta manda sobre el de la query', async () => {
    await controller.findByPet(7, { petId: 1, status: MedicationStatus.ACTIVE });

    expect(service.findAll).toHaveBeenCalledWith({
      petId: 7,
      status: MedicationStatus.ACTIVE,
    });
  });

  it('delega la consulta por ID', async () => {
    const result = await controller.findOne(4);

    expect(service.findOne).toHaveBeenCalledWith(4);
    expect(result.data).toBe(storedMedication);
  });

  it('delega la actualización', async () => {
    const result = await controller.update(4, {
      status: MedicationStatus.DISCONTINUED,
    });

    expect(service.update).toHaveBeenCalledWith(4, {
      status: MedicationStatus.DISCONTINUED,
    });
    expect(result.status).toBe('ok');
  });

  it('responde con data en null al eliminar', async () => {
    const result = await controller.remove(4);

    expect(service.remove).toHaveBeenCalledWith(4);
    expect(result).toEqual({ status: 'ok', data: null });
  });
  it('limpia la contraseña del veterinario si la cita trae el usuario cargado', async () => {
    service.findOne.mockResolvedValue({
      ...storedMedication,
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

    const result = await controller.findOne(4);

    expectNoPassword(result);
    expect(
      (result.data as { appointment: { vet: { userId: number } } }).appointment.vet
        .userId,
    ).toBe(2);
  });
});
