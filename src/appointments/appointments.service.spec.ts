import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../../test/utils/typeorm.mock';
import { Pet } from '../pets/entities/pet.entity';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let context: ReturnType<typeof createDataSourceMock>;

  const pet = { id: 1, active: true };
  const veterinarian = { userId: 2 };
  const storedAppointment = {
    id: 5,
    appointmentDate: new Date('2026-03-01T15:00:00.000Z'),
    reason: 'Control anual',
    status: AppointmentStatus.SCHEDULED,
    diagnosis: null,
    instructions: null,
    petId: 1,
    vetId: 2,
    pet,
    vet: veterinarian,
  };

  const input = {
    petId: 1,
    vetId: 2,
    appointmentDate: '2026-03-01T15:00:00.000Z',
    reason: 'Control anual',
  };

  const allowRelations = () => {
    context.repository(Pet).findOneBy.mockResolvedValue(pet);
    context.repository(Veterinarian).findOneBy.mockResolvedValue(veterinarian);
  };

  beforeEach(async () => {
    context = createDataSourceMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
  });

  describe('create', () => {
    it('lanza NotFoundException cuando la mascota no existe o está inactiva', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Appointment).save).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el veterinario no existe', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(pet);
      context.repository(Veterinarian).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
    });

    it('convierte la fecha a Date y asocia mascota y veterinario', async () => {
      allowRelations();
      context.repository(Appointment).save.mockResolvedValue(storedAppointment);

      const result = await service.create(input);

      expect(context.transaction).toHaveBeenCalled();
      expect(context.repository(Appointment).create).toHaveBeenCalledWith({
        ...input,
        appointmentDate: new Date(input.appointmentDate),
        pet: { id: 1 },
        vet: { userId: 2 },
      });
      expect(result).toBe(storedAppointment);
    });
  });

  describe('findAll', () => {
    it('lanza BadRequestException cuando la fecha final es anterior a la inicial', () => {
      expect(() =>
        service.findAll({ from: '2026-03-10', to: '2026-03-01' }),
      ).toThrow(BadRequestException);
    });

    it('consulta sin filtros y ordena por fecha', async () => {
      await service.findAll();

      expect(context.repository(Appointment).find).toHaveBeenCalledWith({
        where: {},
        relations: { pet: true, vet: { user: true } },
        order: { appointmentDate: 'ASC' },
      });
    });

    it('aplica los filtros de mascota, veterinario, estado y rango de fechas', async () => {
      await service.findAll({
        petId: 1,
        vetId: 2,
        status: AppointmentStatus.CONFIRMED,
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-31T00:00:00.000Z',
      });

      const [options] = context.repository(Appointment).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where.petId).toBe(1);
      expect(options.where.vetId).toBe(2);
      expect(options.where.status).toBe(AppointmentStatus.CONFIRMED);
      expect(options.where).toHaveProperty('appointmentDate');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando la cita no existe', async () => {
      context.repository(Appointment).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve la cita con sus relaciones', async () => {
      context.repository(Appointment).findOne.mockResolvedValue(storedAppointment);

      await expect(service.findOne(5)).resolves.toBe(storedAppointment);
      expect(context.repository(Appointment).findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: { pet: true, vet: { user: true } },
      });
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando la cita no existe', async () => {
      context.repository(Appointment).findOne.mockResolvedValue(null);

      await expect(service.update(99, { reason: 'Otro' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('valida las relaciones nuevas antes de guardar', async () => {
      context.repository(Appointment).findOne.mockResolvedValue({
        ...storedAppointment,
      });
      context.repository(Pet).findOneBy.mockResolvedValue(null);

      await expect(service.update(5, { petId: 7 })).rejects.toThrow(NotFoundException);
      expect(context.repository(Appointment).save).not.toHaveBeenCalled();
    });

    it('actualiza solo los campos enviados', async () => {
      const appointment = { ...storedAppointment };
      context.repository(Appointment).findOne.mockResolvedValue(appointment);
      allowRelations();
      context
        .repository(Appointment)
        .save.mockImplementation(async (entity) => entity);

      const result = await service.update(5, {
        status: AppointmentStatus.COMPLETED,
        diagnosis: 'Sano',
      });

      expect(result).toEqual(
        expect.objectContaining({
          reason: 'Control anual',
          status: AppointmentStatus.COMPLETED,
          diagnosis: 'Sano',
          petId: 1,
          vetId: 2,
        }),
      );
    });

    it('convierte la fecha nueva a Date', async () => {
      const appointment = { ...storedAppointment };
      context.repository(Appointment).findOne.mockResolvedValue(appointment);
      allowRelations();
      context
        .repository(Appointment)
        .save.mockImplementation(async (entity) => entity);

      const result = (await service.update(5, {
        appointmentDate: '2026-04-02T10:00:00.000Z',
      })) as Appointment;

      expect(result.appointmentDate).toEqual(new Date('2026-04-02T10:00:00.000Z'));
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando no se elimina ninguna fila', async () => {
      context.repository(Appointment).delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('elimina la cita existente', async () => {
      context.repository(Appointment).delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(5)).resolves.toBeUndefined();
      expect(context.repository(Appointment).delete).toHaveBeenCalledWith(5);
    });
  });
});
