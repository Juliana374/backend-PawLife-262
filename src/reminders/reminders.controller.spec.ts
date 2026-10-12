import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { Reminder, ReminderType } from './entities/reminder.entity';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

describe('RemindersController', () => {
  let controller: RemindersController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const storedReminder = {
    id: 6,
    title: 'Vacuna anual',
    type: ReminderType.VACCINE,
    completed: false,
    petId: 1,
    createdByUserId: 2,
    pet: { id: 1, name: 'Luna' },
    createdByUser: {
      id: 2,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      password: 'hash-guardado',
    },
  } as unknown as Reminder;

  const input = {
    title: 'Vacuna anual',
    remindAt: '2026-05-01T12:00:00.000Z',
    petId: 1,
    createdByUserId: 2,
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedReminder),
      findAll: jest.fn().mockResolvedValue([storedReminder]),
      findOne: jest.fn().mockResolvedValue(storedReminder),
      update: jest.fn().mockResolvedValue(storedReminder),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    controller = await createControllerUnderTest(
      RemindersController,
      RemindersService,
      service,
    );
  });

  it('quita la contraseña del usuario creador', async () => {
    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result.status).toBe('ok');
    expectNoPassword(result);
    expect((result.data as { createdByUser: unknown }).createdByUser).toEqual({
      id: 2,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
    });
  });

  it('no falla cuando el recordatorio llega sin el usuario cargado', async () => {
    service.findOne.mockResolvedValue({
      ...storedReminder,
      createdByUser: undefined,
    });

    const result = await controller.findOne(6);

    expect(result.status).toBe('ok');
    expectNoPassword(result);
  });

  it('quita la contraseña de cada recordatorio del listado', async () => {
    const result = await controller.findAll({ completed: false });

    expect(service.findAll).toHaveBeenCalledWith({ completed: false });
    expect(Array.isArray(result.data)).toBe(true);
    expectNoPassword(result);
  });

  it('delega marcar como completado al servicio', async () => {
    const result = await controller.update(6, { completed: true });

    expect(service.update).toHaveBeenCalledWith(6, { completed: true });
    expectNoPassword(result);
  });

  it('responde con data en null al eliminar', async () => {
    const result = await controller.remove(6);

    expect(service.remove).toHaveBeenCalledWith(6);
    expect(result).toEqual({ status: 'ok', data: null });
  });
});
