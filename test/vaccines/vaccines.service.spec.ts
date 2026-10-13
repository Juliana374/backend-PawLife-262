import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../utils/typeorm.mock';
import { validatePetAppointment } from '../../src/common/validate-pet-appointment';
import { Vaccine } from '../../src/vaccines/entities/vaccine.entity';
import { VaccinesService } from '../../src/vaccines/vaccines.service';

jest.mock('../../src/common/validate-pet-appointment', () => ({
  validatePetAppointment: jest.fn(),
}));

const validateRelations = validatePetAppointment as jest.Mock;

describe('VaccinesService', () => {
  let service: VaccinesService;
  let context: ReturnType<typeof createDataSourceMock>;

  const storedVaccine = {
    id: 3,
    name: 'Rabia',
    petId: 1,
    appointmentId: null,
    applicationDate: '2026-02-01',
    nextDoseDate: null,
  };

  beforeEach(async () => {
    context = createDataSourceMock();
    validateRelations.mockReset();
    validateRelations.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        VaccinesService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(VaccinesService);
  });

  describe('create', () => {
    const input = {
      name: 'Rabia',
      petId: 1,
      applicationDate: '2026-02-01',
    };

    it('lanza BadRequestException cuando la próxima dosis es anterior a la aplicación', async () => {
      await expect(
        service.create({ ...input, nextDoseDate: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
      expect(validateRelations).not.toHaveBeenCalled();
    });

    it('propaga el error cuando la mascota o la cita no son válidas', async () => {
      validateRelations.mockRejectedValue(new NotFoundException('Mascota no encontrada'));

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Vaccine).save).not.toHaveBeenCalled();
    });

    it('usa la fecha de hoy cuando no se envía la fecha de aplicación', async () => {
      const today = new Date().toISOString().slice(0, 10);

      await expect(
        service.create({ name: 'Rabia', petId: 1, nextDoseDate: today }),
      ).resolves.toBeDefined();
      expect(validateRelations).toHaveBeenCalledWith(context.manager, 1, undefined);
    });

    it('guarda la vacuna con la relación de mascota y sin cita', async () => {
      context.repository(Vaccine).save.mockResolvedValue(storedVaccine);

      const result = await service.create(input);

      expect(context.repository(Vaccine).create).toHaveBeenCalledWith({
        ...input,
        pet: { id: 1 },
        appointment: null,
      });
      expect(result).toBe(storedVaccine);
    });

    it('asocia la cita cuando se envía appointmentId', async () => {
      await service.create({ ...input, appointmentId: 7 });

      expect(context.repository(Vaccine).create).toHaveBeenCalledWith(
        expect.objectContaining({ appointment: { id: 7 } }),
      );
      expect(validateRelations).toHaveBeenCalledWith(context.manager, 1, 7);
    });
  });

  describe('findAll', () => {
    it('lanza BadRequestException cuando el rango de fechas es inválido', () => {
      expect(() => service.findAll({ from: '2026-03-10', to: '2026-03-01' })).toThrow(
        BadRequestException,
      );
    });

    it('consulta sin filtros y ordena por fecha de aplicación', async () => {
      await service.findAll();

      expect(context.repository(Vaccine).find).toHaveBeenCalledWith({
        where: {},
        relations: { pet: true, appointment: { vet: true } },
        order: { applicationDate: 'DESC' },
      });
    });

    it('aplica los filtros de mascota, cita y rango de fechas', async () => {
      await service.findAll({
        petId: 1,
        appointmentId: 7,
        from: '2026-01-01',
        to: '2026-12-31',
      });

      const [options] = context.repository(Vaccine).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where.petId).toBe(1);
      expect(options.where.appointmentId).toBe(7);
      expect(options.where).toHaveProperty('applicationDate');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando la vacuna no existe', async () => {
      context.repository(Vaccine).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve la vacuna con sus relaciones', async () => {
      context.repository(Vaccine).findOne.mockResolvedValue(storedVaccine);

      await expect(service.findOne(3)).resolves.toBe(storedVaccine);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando la vacuna no existe', async () => {
      context.repository(Vaccine).findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Moquillo' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando la próxima dosis queda antes de la aplicación', async () => {
      context.repository(Vaccine).findOne.mockResolvedValue({ ...storedVaccine });

      await expect(service.update(3, { nextDoseDate: '2026-01-01' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('conserva los valores actuales cuando no se envían campos', async () => {
      context.repository(Vaccine).findOne.mockResolvedValue({ ...storedVaccine });
      context.repository(Vaccine).save.mockImplementation(async (entity) => entity);

      const result = await service.update(3, { name: 'Rabia refuerzo' });

      expect(validateRelations).toHaveBeenCalledWith(context.manager, 1, null);
      expect(result).toEqual(
        expect.objectContaining({
          name: 'Rabia refuerzo',
          petId: 1,
          applicationDate: '2026-02-01',
        }),
      );
    });

    it('permite desasociar la cita enviando null', async () => {
      context.repository(Vaccine).findOne.mockResolvedValue({
        ...storedVaccine,
        appointmentId: 7,
      });
      context.repository(Vaccine).save.mockImplementation(async (entity) => entity);

      const result = (await service.update(3, { appointmentId: null })) as Vaccine;

      expect(result.appointment).toBeNull();
      expect(result.appointmentId).toBeNull();
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando no se elimina ninguna fila', async () => {
      context.repository(Vaccine).delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('elimina la vacuna existente', async () => {
      context.repository(Vaccine).delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(3)).resolves.toBeUndefined();
      expect(context.repository(Vaccine).delete).toHaveBeenCalledWith(3);
    });
  });
});
