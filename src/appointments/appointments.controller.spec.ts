import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const storedAppointment = {
    id: 5,
    reason: 'Control anual',
    status: AppointmentStatus.SCHEDULED,
    petId: 1,
    vetId: 2,
    pet: { id: 1, name: 'Luna' },
    vet: {
      userId: 2,
      licenseNumber: 'MV-1234',
      user: {
        id: 2,
        name: 'Ana Gómez',
        email: 'ana@pawlife.com',
        password: 'hash-guardado',
      },
    },
  } as unknown as Appointment;

  const input = {
    petId: 1,
    vetId: 2,
    appointmentDate: '2026-03-01T15:00:00.000Z',
    reason: 'Control anual',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedAppointment),
      findAll: jest.fn().mockResolvedValue([storedAppointment]),
      findOne: jest.fn().mockResolvedValue(storedAppointment),
      update: jest.fn().mockResolvedValue(storedAppointment),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    controller = await createControllerUnderTest(
      AppointmentsController,
      AppointmentsService,
      service,
    );
  });

  it('quita la contraseña del veterinario anidado', async () => {
    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result.status).toBe('ok');
    expectNoPassword(result);
    expect((result.data as { vet: { user: unknown } }).vet.user).toEqual({
      id: 2,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
    });
  });

  it('conserva el resto de los datos del veterinario', async () => {
    const result = await controller.findOne(5);
    const vet = (result.data as unknown as { vet: Record<string, unknown> }).vet;

    expect(vet.userId).toBe(2);
    expect(vet.licenseNumber).toBe('MV-1234');
  });

  it('no falla cuando la cita llega sin el usuario del veterinario', async () => {
    service.findOne.mockResolvedValue({
      ...storedAppointment,
      vet: { userId: 2, licenseNumber: 'MV-1234' },
    });

    const result = await controller.findOne(5);

    expect(result.status).toBe('ok');
    expectNoPassword(result);
  });

  it('quita la contraseña de cada cita del listado', async () => {
    const result = await controller.findAll({ petId: 1 });

    expect(service.findAll).toHaveBeenCalledWith({ petId: 1 });
    expect(Array.isArray(result.data)).toBe(true);
    expectNoPassword(result);
  });

  it('delega la actualización al servicio', async () => {
    const result = await controller.update(5, {
      status: AppointmentStatus.COMPLETED,
    });

    expect(service.update).toHaveBeenCalledWith(5, {
      status: AppointmentStatus.COMPLETED,
    });
    expectNoPassword(result);
  });

  it('responde con data en null al eliminar', async () => {
    const result = await controller.remove(5);

    expect(service.remove).toHaveBeenCalledWith(5);
    expect(result).toEqual({ status: 'ok', data: null });
  });
});
