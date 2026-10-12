import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../../test/utils/typeorm.mock';
import { validatePetAppointment } from '../common/validate-pet-appointment';
import { Medication, MedicationStatus } from './entities/medication.entity';
import { MedicationsService } from './medications.service';

jest.mock('../common/validate-pet-appointment', () => ({
  validatePetAppointment: jest.fn(),
}));

const validateRelations = validatePetAppointment as jest.Mock;

describe('MedicationsService', () => {
  let service: MedicationsService;
  let context: ReturnType<typeof createDataSourceMock>;

  const storedMedication = {
    id: 4,
    name: 'Amoxicilina',
    dose: '250 mg',
    schedule: 'Cada 12 horas',
    status: MedicationStatus.ACTIVE,
    petId: 1,
    appointmentId: null,
    startDate: '2026-02-01',
    endDate: null,
  };

  const input = {
    name: 'Amoxicilina',
    dose: '250 mg',
    schedule: 'Cada 12 horas',
    petId: 1,
    startDate: '2026-02-01',
  };

  beforeEach(async () => {
    context = createDataSourceMock();
    validateRelations.mockReset();
    validateRelations.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        MedicationsService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(MedicationsService);
  });

  describe('create', () => {
    it('lanza BadRequestException cuando la fecha final es anterior al inicio', async () => {
      await expect(
        service.create({ ...input, endDate: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
      expect(validateRelations).not.toHaveBeenCalled();
    });

    it('propaga el error cuando la mascota o la cita no son válidas', async () => {
      validateRelations.mockRejectedValue(new NotFoundException('Mascota no encontrada'));

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Medication).save).not.toHaveBeenCalled();
    });

    it('guarda el medicamento con la relación de mascota y sin cita', async () => {
      context.repository(Medication).save.mockResolvedValue(storedMedication);

      const result = await service.create(input);

      expect(context.repository(Medication).create).toHaveBeenCalledWith({
        ...input,
        pet: { id: 1 },
        appointment: null,
      });
      expect(result).toBe(storedMedication);
    });

    it('asocia la cita cuando se envía appointmentId', async () => {
      await service.create({ ...input, appointmentId: 7 });

      expect(context.repository(Medication).create).toHaveBeenCalledWith(
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

    it('consulta sin filtros y ordena por fecha de inicio', async () => {
      await service.findAll();

      expect(context.repository(Medication).find).toHaveBeenCalledWith({
        where: {},
        relations: { pet: true, appointment: { vet: true } },
        order: { startDate: 'DESC' },
      });
    });

    it('aplica los filtros de mascota, cita, estado y rango de fechas', async () => {
      await service.findAll({
        petId: 1,
        appointmentId: 7,
        status: MedicationStatus.ACTIVE,
        from: '2026-01-01',
        to: '2026-12-31',
      });

      const [options] = context.repository(Medication).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where.petId).toBe(1);
      expect(options.where.appointmentId).toBe(7);
      expect(options.where.status).toBe(MedicationStatus.ACTIVE);
      expect(options.where).toHaveProperty('startDate');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el medicamento no existe', async () => {
      context.repository(Medication).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el medicamento con sus relaciones', async () => {
      context.repository(Medication).findOne.mockResolvedValue(storedMedication);

      await expect(service.findOne(4)).resolves.toBe(storedMedication);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando el medicamento no existe', async () => {
      context.repository(Medication).findOne.mockResolvedValue(null);

      await expect(service.update(99, { dose: '500 mg' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando la fecha final queda antes del inicio', async () => {
      context.repository(Medication).findOne.mockResolvedValue({ ...storedMedication });

      await expect(service.update(4, { endDate: '2026-01-01' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('actualiza el estado conservando las fechas actuales', async () => {
      context.repository(Medication).findOne.mockResolvedValue({ ...storedMedication });
      context.repository(Medication).save.mockImplementation(async (entity) => entity);

      const result = await service.update(4, {
        status: MedicationStatus.DISCONTINUED,
      });

      expect(result).toEqual(
        expect.objectContaining({
          status: MedicationStatus.DISCONTINUED,
          startDate: '2026-02-01',
          petId: 1,
        }),
      );
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando no se elimina ninguna fila', async () => {
      context.repository(Medication).delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('elimina el medicamento existente', async () => {
      context.repository(Medication).delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(4)).resolves.toBeUndefined();
      expect(context.repository(Medication).delete).toHaveBeenCalledWith(4);
    });
  });
});
