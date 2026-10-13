import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../utils/typeorm.mock';
import { validatePetAppointment } from '../../src/common/validate-pet-appointment';
import { Medication } from '../../src/medication-catalog/entities/medication.entity';
import {
  PetMedication,
  PetMedicationStatus,
} from '../../src/pets-medication/entities/medication.entity';
import { PetMedicationsService } from '../../src/pets-medication/medications.service';

jest.mock('../../src/common/validate-pet-appointment', () => ({
  validatePetAppointment: jest.fn(),
}));

const validateRelations = validatePetAppointment as jest.Mock;

describe('PetMedicationsService', () => {
  let service: PetMedicationsService;
  let context: ReturnType<typeof createDataSourceMock>;

  const catalogMedication = {
    id: 7,
    name: 'Amoxicilina',
    isActive: true,
  } as unknown as Medication;

  const storedMedication = {
    id: 4,
    name: 'Amoxicilina',
    dose: '250 mg',
    schedule: 'Cada 12 horas',
    status: PetMedicationStatus.ACTIVE,
    petId: 1,
    appointmentId: null,
    medicationCatalogId: 7,
    medicationCatalog: catalogMedication,
    startDate: '2026-02-01',
    endDate: null,
  } as unknown as PetMedication;

  const input = {
    medicationCatalogId: 7,
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
        PetMedicationsService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(PetMedicationsService);
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
      expect(context.repository(PetMedication).save).not.toHaveBeenCalled();
    });

    it('exige que el medicamento del catálogo exista y esté activo', async () => {
      context.repository(Medication).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Medication).findOneBy).toHaveBeenCalledWith({
        id: 7,
        isActive: true,
      });
      expect(context.repository(PetMedication).save).not.toHaveBeenCalled();
    });

    it('copia el nombre del catálogo y asocia las relaciones', async () => {
      context.repository(Medication).findOneBy.mockResolvedValue(catalogMedication);
      context.repository(PetMedication).save.mockResolvedValue(storedMedication);

      const result = await service.create(input);

      expect(context.repository(PetMedication).create).toHaveBeenCalledWith({
        ...input,
        name: 'Amoxicilina',
        medicationCatalog: catalogMedication,
        pet: { id: 1 },
        appointment: null,
      });
      expect(result).toBe(storedMedication);
    });

    it('asocia la cita cuando se envía appointmentId', async () => {
      context.repository(Medication).findOneBy.mockResolvedValue(catalogMedication);

      await service.create({ ...input, appointmentId: 5 });

      expect(context.repository(PetMedication).create).toHaveBeenCalledWith(
        expect.objectContaining({ appointment: { id: 5 } }),
      );
      expect(validateRelations).toHaveBeenCalledWith(context.manager, 1, 5);
    });
  });

  describe('findAll', () => {
    it('lanza BadRequestException cuando el rango de fechas es inválido', () => {
      expect(() => service.findAll({ from: '2026-03-10', to: '2026-03-01' })).toThrow(
        BadRequestException,
      );
    });

    it('trae el catálogo con innerJoin y ordena por fecha de inicio', async () => {
      const builder = context.repository(PetMedication).queryBuilder;

      await service.findAll();

      expect(builder.innerJoinAndSelect).toHaveBeenCalledWith(
        'petMedication.medicationCatalog',
        'medicationCatalog',
      );
      expect(builder.orderBy).toHaveBeenCalledWith('petMedication.startDate', 'DESC');
      expect(builder.andWhere).not.toHaveBeenCalled();
    });

    it('agrega una condición por cada filtro enviado', async () => {
      const builder = context.repository(PetMedication).queryBuilder;

      await service.findAll({
        petId: 1,
        appointmentId: 5,
        status: PetMedicationStatus.ACTIVE,
        from: '2026-01-01',
        to: '2026-12-31',
      });

      expect(builder.andWhere).toHaveBeenCalledTimes(5);
      expect(builder.andWhere).toHaveBeenCalledWith(
        'petMedication.petId = :petId',
        { petId: 1 },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        'petMedication.startDate >= :from',
        { from: '2026-01-01' },
      );
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el medicamento no existe', async () => {
      context.repository(PetMedication).queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el medicamento con sus relaciones', async () => {
      context
        .repository(PetMedication)
        .queryBuilder.getOne.mockResolvedValue(storedMedication);

      await expect(service.findOne(4)).resolves.toBe(storedMedication);
      expect(context.repository(PetMedication).queryBuilder.where).toHaveBeenCalledWith(
        'petMedication.id = :id',
        { id: 4 },
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      context
        .repository(PetMedication)
        .queryBuilder.getOne.mockResolvedValue({ ...storedMedication });
      context
        .repository(PetMedication)
        .save.mockImplementation(async (entity) => entity);
    });

    it('lanza NotFoundException cuando el medicamento no existe', async () => {
      context.repository(PetMedication).queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.update(99, { dose: '500 mg' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza un ID de catálogo que no sea entero', async () => {
      await expect(
        service.update(4, { medicationCatalogId: 1.5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('conserva el catálogo actual cuando no se envía medicationCatalogId', async () => {
      const result = await service.update(4, { dose: '500 mg' });

      expect(context.repository(Medication).findOneBy).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({ dose: '500 mg', name: 'Amoxicilina' }),
      );
    });

    it('actualiza el nombre cuando cambia el medicamento del catálogo', async () => {
      context.repository(Medication).findOneBy.mockResolvedValue({
        id: 9,
        name: 'Ibuprofeno',
        isActive: true,
      });

      const result = await service.update(4, { medicationCatalogId: 9 });

      expect(result).toEqual(
        expect.objectContaining({ name: 'Ibuprofeno', medicationCatalogId: 9 }),
      );
    });

    it('lanza NotFoundException cuando el catálogo nuevo no existe o está inactivo', async () => {
      context.repository(Medication).findOneBy.mockResolvedValue(null);

      await expect(service.update(4, { medicationCatalogId: 9 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException cuando la fecha final queda antes del inicio', async () => {
      await expect(service.update(4, { endDate: '2026-01-01' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando no se elimina ninguna fila', async () => {
      context.repository(PetMedication).delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('elimina el medicamento existente', async () => {
      context.repository(PetMedication).delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(4)).resolves.toBeUndefined();
      expect(context.repository(PetMedication).delete).toHaveBeenCalledWith(4);
    });
  });
});
