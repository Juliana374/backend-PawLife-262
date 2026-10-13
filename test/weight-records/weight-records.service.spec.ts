import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../utils/typeorm.mock';
import { validatePetAppointment } from '../../src/common/validate-pet-appointment';
import { WeightRecord } from '../../src/weight-records/entities/weight-record.entity';
import { WeightRecordsService } from '../../src/weight-records/weight-records.service';

jest.mock('../../src/common/validate-pet-appointment', () => ({
  validatePetAppointment: jest.fn(),
}));

const validateRelations = validatePetAppointment as jest.Mock;

const today = () => new Date().toISOString().slice(0, 10);

describe('WeightRecordsService', () => {
  let service: WeightRecordsService;
  let context: ReturnType<typeof createDataSourceMock>;

  const storedRecord = {
    id: 8,
    weightKg: 12.4,
    petId: 1,
    appointmentId: null,
    measurementDate: '2026-02-01',
  };

  const input = { weightKg: 12.4, petId: 1, measurementDate: '2026-02-01' };

  beforeEach(async () => {
    context = createDataSourceMock();
    validateRelations.mockReset();
    validateRelations.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        WeightRecordsService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(WeightRecordsService);
  });

  describe('create', () => {
    it('lanza BadRequestException cuando la medición está en el futuro', async () => {
      const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

      await expect(
        service.create({ ...input, measurementDate: future }),
      ).rejects.toThrow(BadRequestException);
      expect(validateRelations).not.toHaveBeenCalled();
    });

    it('acepta una medición de hoy', async () => {
      await expect(
        service.create({ ...input, measurementDate: today() }),
      ).resolves.toBeDefined();
    });

    it('propaga el error cuando la mascota o la cita no son válidas', async () => {
      validateRelations.mockRejectedValue(new NotFoundException('Mascota no encontrada'));

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(WeightRecord).save).not.toHaveBeenCalled();
    });

    it('guarda el registro con la relación de mascota y sin cita', async () => {
      context.repository(WeightRecord).save.mockResolvedValue(storedRecord);

      const result = await service.create(input);

      expect(context.repository(WeightRecord).create).toHaveBeenCalledWith({
        ...input,
        pet: { id: 1 },
        appointment: null,
      });
      expect(result).toBe(storedRecord);
    });

    it('asocia la cita cuando se envía appointmentId', async () => {
      await service.create({ ...input, appointmentId: 7 });

      expect(context.repository(WeightRecord).create).toHaveBeenCalledWith(
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

    it('consulta sin filtros y ordena de la medición más reciente a la más antigua', async () => {
      await service.findAll();

      expect(context.repository(WeightRecord).find).toHaveBeenCalledWith({
        where: {},
        relations: { pet: true, appointment: { vet: true } },
        order: { measurementDate: 'DESC' },
      });
    });

    it('aplica los filtros de mascota, cita y rango de fechas', async () => {
      await service.findAll({
        petId: 1,
        appointmentId: 7,
        from: '2026-01-01',
        to: '2026-12-31',
      });

      const [options] = context.repository(WeightRecord).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where.petId).toBe(1);
      expect(options.where.appointmentId).toBe(7);
      expect(options.where).toHaveProperty('measurementDate');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el registro no existe', async () => {
      context.repository(WeightRecord).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el registro con sus relaciones', async () => {
      context.repository(WeightRecord).findOne.mockResolvedValue(storedRecord);

      await expect(service.findOne(8)).resolves.toBe(storedRecord);
      expect(context.repository(WeightRecord).findOne).toHaveBeenCalledWith({
        where: { id: 8 },
        relations: { pet: true, appointment: { vet: true } },
      });
    });
  });
});
