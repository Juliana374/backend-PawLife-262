import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../utils/typeorm.mock';
import { Pet } from '../../src/pets/entities/pet.entity';
import { User } from '../../src/users/entities/user.entity';
import { Reminder, ReminderType } from '../../src/reminders/entities/reminder.entity';
import { RemindersService } from '../../src/reminders/reminders.service';

describe('RemindersService', () => {
  let service: RemindersService;
  let context: ReturnType<typeof createDataSourceMock>;

  const pet = { id: 1, active: true };
  const user = { id: 2 };
  const storedReminder = {
    id: 6,
    title: 'Vacuna anual',
    description: null,
    type: ReminderType.VACCINE,
    completed: false,
    remindAt: new Date('2026-05-01T12:00:00.000Z'),
    petId: 1,
    createdByUserId: 2,
  };

  const input = {
    title: 'Vacuna anual',
    remindAt: '2026-05-01T12:00:00.000Z',
    petId: 1,
    createdByUserId: 2,
  };

  const allowRelations = () => {
    context.repository(Pet).findOneBy.mockResolvedValue(pet);
    context.repository(User).findOneBy.mockResolvedValue(user);
  };

  beforeEach(async () => {
    context = createDataSourceMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(RemindersService);
  });

  describe('create', () => {
    it('lanza NotFoundException cuando la mascota no existe o está inactiva', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Reminder).save).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el usuario creador no existe', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(pet);
      context.repository(User).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
    });

    it('convierte remindAt a Date y asocia mascota y usuario', async () => {
      allowRelations();
      context.repository(Reminder).save.mockResolvedValue(storedReminder);

      const result = await service.create(input);

      expect(context.repository(Reminder).create).toHaveBeenCalledWith({
        ...input,
        remindAt: new Date(input.remindAt),
        pet: { id: 1 },
        createdByUser: { id: 2 },
      });
      expect(result).toBe(storedReminder);
    });
  });

  describe('findAll', () => {
    it('lanza BadRequestException cuando el rango de fechas es inválido', () => {
      expect(() =>
        service.findAll({
          from: '2026-05-10T00:00:00.000Z',
          to: '2026-05-01T00:00:00.000Z',
        }),
      ).toThrow(BadRequestException);
    });

    it('consulta sin filtros y ordena por fecha de aviso', async () => {
      await service.findAll();

      expect(context.repository(Reminder).find).toHaveBeenCalledWith({
        where: {},
        relations: { pet: true, createdByUser: true },
        order: { remindAt: 'ASC' },
      });
    });

    it('aplica los filtros de mascota, usuario, estado y tipo', async () => {
      await service.findAll({
        petId: 1,
        createdByUserId: 2,
        completed: false,
        type: ReminderType.CHECKUP,
      });

      const [options] = context.repository(Reminder).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where.petId).toBe(1);
      expect(options.where.createdByUserId).toBe(2);
      expect(options.where.completed).toBe(false);
      expect(options.where.type).toBe(ReminderType.CHECKUP);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el recordatorio no existe', async () => {
      context.repository(Reminder).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el recordatorio con sus relaciones', async () => {
      context.repository(Reminder).findOne.mockResolvedValue(storedReminder);

      await expect(service.findOne(6)).resolves.toBe(storedReminder);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando el recordatorio no existe', async () => {
      context.repository(Reminder).findOne.mockResolvedValue(null);

      await expect(service.update(99, { completed: true })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('valida las relaciones nuevas antes de guardar', async () => {
      context.repository(Reminder).findOne.mockResolvedValue({ ...storedReminder });
      context.repository(Pet).findOneBy.mockResolvedValue(null);

      await expect(service.update(6, { petId: 9 })).rejects.toThrow(NotFoundException);
      expect(context.repository(Reminder).save).not.toHaveBeenCalled();
    });

    it('marca el recordatorio como completado', async () => {
      context.repository(Reminder).findOne.mockResolvedValue({ ...storedReminder });
      allowRelations();
      context.repository(Reminder).save.mockImplementation(async (entity) => entity);

      const result = await service.update(6, { completed: true });

      expect(result).toEqual(
        expect.objectContaining({ completed: true, petId: 1, createdByUserId: 2 }),
      );
    });

    it('convierte la fecha nueva a Date', async () => {
      context.repository(Reminder).findOne.mockResolvedValue({ ...storedReminder });
      allowRelations();
      context.repository(Reminder).save.mockImplementation(async (entity) => entity);

      const result = (await service.update(6, {
        remindAt: '2026-06-01T09:00:00.000Z',
      })) as Reminder;

      expect(result.remindAt).toEqual(new Date('2026-06-01T09:00:00.000Z'));
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando no se elimina ninguna fila', async () => {
      context.repository(Reminder).delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('elimina el recordatorio existente', async () => {
      context.repository(Reminder).delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(6)).resolves.toBeUndefined();
      expect(context.repository(Reminder).delete).toHaveBeenCalledWith(6);
    });
  });
});
