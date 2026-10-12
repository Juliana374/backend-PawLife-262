import { ConflictException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../../test/utils/typeorm.mock';
import { User } from '../users/entities/user.entity';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansService } from './veterinarians.service';

describe('VeterinariansService', () => {
  let service: VeterinariansService;
  let context: ReturnType<typeof createDataSourceMock>;

  const user = { id: 1, name: 'Ana Gómez' };
  const storedVeterinarian = {
    userId: 1,
    licenseNumber: 'MV-1234',
    specialty: 'Cirugía',
    user,
  };

  const input = { userId: 1, licenseNumber: 'MV-1234', specialty: 'Cirugía' };

  beforeEach(async () => {
    context = createDataSourceMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        VeterinariansService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(VeterinariansService);
  });

  describe('create', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      context.repository(User).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Veterinarian).save).not.toHaveBeenCalled();
    });

    it('lanza ConflictException cuando el usuario ya tiene perfil veterinario', async () => {
      context.repository(User).findOneBy.mockResolvedValue(user);
      context
        .repository(Veterinarian)
        .findOneBy.mockResolvedValueOnce(storedVeterinarian);

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException cuando la licencia ya está registrada', async () => {
      context.repository(User).findOneBy.mockResolvedValue(user);
      context
        .repository(Veterinarian)
        .findOneBy.mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...storedVeterinarian, userId: 2 });

      await expect(service.create(input)).rejects.toThrow(ConflictException);
    });

    it('crea el perfil dentro de una transacción', async () => {
      context.repository(User).findOneBy.mockResolvedValue(user);
      context
        .repository(Veterinarian)
        .findOneBy.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      context.repository(Veterinarian).save.mockResolvedValue(storedVeterinarian);

      const result = await service.create(input);

      expect(context.transaction).toHaveBeenCalled();
      expect(context.repository(Veterinarian).create).toHaveBeenCalledWith({
        ...input,
        user,
      });
      expect(result).toBe(storedVeterinarian);
    });
  });

  describe('findAll', () => {
    it('consulta sin filtros y ordena por usuario', async () => {
      await service.findAll();

      expect(context.repository(Veterinarian).find).toHaveBeenCalledWith({
        where: {},
        relations: { user: true },
        order: { userId: 'ASC' },
      });
    });

    it('aplica los filtros de especialidad y nombre', async () => {
      await service.findAll({ specialty: 'cirugía', name: 'Ana' });

      const [options] = context.repository(Veterinarian).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where).toHaveProperty('specialty');
      expect(options.where).toHaveProperty('user');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el veterinario no existe', async () => {
      context.repository(Veterinarian).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el veterinario con su usuario', async () => {
      context.repository(Veterinarian).findOne.mockResolvedValue(storedVeterinarian);

      await expect(service.findOne(1)).resolves.toBe(storedVeterinarian);
      expect(context.repository(Veterinarian).findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: { user: true },
      });
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando el veterinario no existe', async () => {
      context.repository(Veterinarian).findOne.mockResolvedValue(null);

      await expect(service.update(99, { specialty: 'Dermatología' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ConflictException cuando la licencia pertenece a otro veterinario', async () => {
      context.repository(Veterinarian).findOne.mockResolvedValue({
        ...storedVeterinarian,
      });
      context
        .repository(Veterinarian)
        .findOneBy.mockResolvedValue({ ...storedVeterinarian, userId: 2 });

      await expect(service.update(1, { licenseNumber: 'MV-9999' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('permite conservar la misma licencia del veterinario', async () => {
      const veterinarian = { ...storedVeterinarian };
      context.repository(Veterinarian).findOne.mockResolvedValue(veterinarian);
      context.repository(Veterinarian).findOneBy.mockResolvedValue(veterinarian);
      context.repository(Veterinarian).save.mockResolvedValue(veterinarian);

      await expect(
        service.update(1, { licenseNumber: 'MV-1234' }),
      ).resolves.toBe(veterinarian);
    });

    it('actualiza licencia y especialidad', async () => {
      const veterinarian = { ...storedVeterinarian };
      context.repository(Veterinarian).findOne.mockResolvedValue(veterinarian);
      context.repository(Veterinarian).findOneBy.mockResolvedValue(null);
      context.repository(Veterinarian).save.mockImplementation(async (entity) => entity);

      const result = await service.update(1, {
        licenseNumber: 'MV-9999',
        specialty: 'Dermatología',
      });

      expect(result).toEqual(
        expect.objectContaining({
          licenseNumber: 'MV-9999',
          specialty: 'Dermatología',
        }),
      );
    });
  });
});
