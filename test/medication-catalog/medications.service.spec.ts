import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../utils/typeorm.mock';
import { Medication } from '../../src/medication-catalog/entities/medication.entity';
import { MedicationsService } from '../../src/medication-catalog/medications.service';

describe('MedicationsService (catálogo)', () => {
  let service: MedicationsService;
  let context: ReturnType<typeof createDataSourceMock>;

  const storedMedication = {
    id: 1,
    name: 'Amoxicilina',
    activeIngredient: 'Amoxicilina trihidrato',
    concentration: '250 mg',
    presentation: 'Tableta',
    description: null,
    isActive: true,
  } as unknown as Medication;

  beforeEach(async () => {
    context = createDataSourceMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        MedicationsService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(MedicationsService);
  });

  describe('findAll', () => {
    it('lista el catálogo ordenado por nombre', async () => {
      await service.findAll();

      expect(context.repository(Medication).find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('create', () => {
    it('guarda el medicamento del catálogo', async () => {
      const input = { name: 'Amoxicilina', concentration: '250 mg' };
      context.repository(Medication).save.mockResolvedValue(storedMedication);

      const result = await service.create(input);

      expect(context.repository(Medication).create).toHaveBeenCalledWith(input);
      expect(result).toBe(storedMedication);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el medicamento no existe', async () => {
      context.repository(Medication).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el medicamento encontrado', async () => {
      context.repository(Medication).findOne.mockResolvedValue(storedMedication);

      await expect(service.findOne(1)).resolves.toBe(storedMedication);
      expect(context.repository(Medication).findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando el medicamento no existe', async () => {
      context.repository(Medication).findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Otro' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('mezcla los campos enviados sobre el medicamento existente', async () => {
      const medication = { ...storedMedication };
      context.repository(Medication).findOne.mockResolvedValue(medication);
      context.repository(Medication).save.mockImplementation(async (entity) => entity);

      const result = await service.update(1, {
        concentration: '500 mg',
        isActive: false,
      });

      expect(result).toEqual(
        expect.objectContaining({
          name: 'Amoxicilina',
          concentration: '500 mg',
          isActive: false,
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

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(context.repository(Medication).delete).toHaveBeenCalledWith(1);
    });
  });
});
