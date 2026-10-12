import { unlink } from 'node:fs/promises';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../../test/utils/typeorm.mock';
import { User } from '../users/entities/user.entity';
import { Pet, PetSpecies } from './entities/pet.entity';
import { Photo } from './entities/photo.entity';
import { PetsService } from './pets.service';

jest.mock('node:fs/promises', () => ({
  unlink: jest.fn(),
}));

const unlinkMock = unlink as unknown as jest.Mock;

describe('PetsService', () => {
  let service: PetsService;
  let context: ReturnType<typeof createDataSourceMock>;

  const owner = { id: 2 };
  const storedPet = {
    id: 1,
    name: 'Luna',
    species: PetSpecies.DOG,
    breed: null,
    sex: null,
    birthDate: null,
    active: true,
    owner,
    photos: [],
  };

  const input = { name: 'Luna', species: PetSpecies.DOG, ownerId: 2 };

  beforeEach(async () => {
    context = createDataSourceMock();
    unlinkMock.mockReset();
    unlinkMock.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(PetsService);
  });

  describe('create', () => {
    it('lanza NotFoundException cuando el propietario no existe', async () => {
      context.repository(User).findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(context.repository(Pet).save).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException cuando la fecha de nacimiento está en el futuro', async () => {
      context.repository(User).findOneBy.mockResolvedValue(owner);
      const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

      await expect(service.create({ ...input, birthDate: future })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('borra las fotos subidas cuando la creación falla', async () => {
      context.repository(User).findOneBy.mockResolvedValue(null);

      await expect(
        service.create(input, [{ filename: 'luna.jpg', originalName: 'luna.jpg' }]),
      ).rejects.toThrow(NotFoundException);
      expect(unlinkMock).toHaveBeenCalledTimes(1);
    });

    it('crea la mascota activa por defecto y devuelve la versión con relaciones', async () => {
      context.repository(User).findOneBy.mockResolvedValue(owner);
      context.repository(Pet).save.mockResolvedValue(storedPet);
      context.repository(Pet).findOne.mockResolvedValue(storedPet);

      const result = await service.create(input);

      expect(context.repository(Pet).create).toHaveBeenCalledWith({
        name: 'Luna',
        species: PetSpecies.DOG,
        active: true,
        birthDate: null,
        owner: { id: 2 },
      });
      expect(result).toBe(storedPet);
      expect(context.repository(Photo).save).not.toHaveBeenCalled();
    });

    it('guarda las fotos asociadas a la mascota creada', async () => {
      context.repository(User).findOneBy.mockResolvedValue(owner);
      context.repository(Pet).save.mockResolvedValue(storedPet);
      context.repository(Pet).findOne.mockResolvedValue(storedPet);

      await service.create(input, [
        { filename: 'luna-1.jpg', originalName: 'foto1.jpg' },
      ]);

      expect(context.repository(Photo).create).toHaveBeenCalledWith({
        filename: 'luna-1.jpg',
        originalName: 'foto1.jpg',
        pet: storedPet,
      });
      expect(context.repository(Photo).save).toHaveBeenCalled();
      expect(unlinkMock).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('devuelve solo las mascotas activas por defecto', async () => {
      await service.findAll();

      expect(context.repository(Pet).find).toHaveBeenCalledWith({
        where: { active: true },
        relations: { owner: true, photos: true },
        order: { id: 'ASC' },
      });
    });

    it('aplica los filtros de nombre, especie y propietario', async () => {
      await service.findAll({
        name: 'lu',
        species: PetSpecies.CAT,
        ownerId: 2,
      });

      const [options] = context.repository(Pet).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where).toHaveProperty('name');
      expect(options.where.species).toBe(PetSpecies.CAT);
      expect(options.where.owner).toEqual({ id: 2 });
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando la mascota no existe o está inactiva', async () => {
      context.repository(Pet).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve la mascota con propietario y fotos', async () => {
      context.repository(Pet).findOne.mockResolvedValue(storedPet);

      await expect(service.findOne(1)).resolves.toBe(storedPet);
      expect(context.repository(Pet).findOne).toHaveBeenCalledWith({
        where: { id: 1, active: true },
        relations: { owner: true, photos: true },
      });
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando la mascota no existe', async () => {
      context.repository(Pet).findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Nala' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('valida el propietario nuevo', async () => {
      context.repository(Pet).findOne.mockResolvedValue({ ...storedPet });
      context.repository(User).findOneBy.mockResolvedValue(null);

      await expect(service.update(1, { ownerId: 99 })).rejects.toThrow(
        NotFoundException,
      );
      expect(context.repository(Pet).save).not.toHaveBeenCalled();
    });

    it('mezcla los campos enviados y devuelve la mascota actualizada', async () => {
      const pet = { ...storedPet };
      context.repository(Pet).findOne.mockResolvedValue(pet);

      await service.update(1, { name: 'Nala' });

      expect(context.repository(Pet).merge).toHaveBeenCalledWith(pet, {
        name: 'Nala',
      });
      expect(context.repository(Pet).save).toHaveBeenCalledWith(pet);
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando la mascota no existe o ya está inactiva', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('desactiva la mascota en lugar de borrarla', async () => {
      const pet = { ...storedPet };
      context.repository(Pet).findOneBy.mockResolvedValue(pet);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(pet.active).toBe(false);
      expect(context.repository(Pet).save).toHaveBeenCalledWith(pet);
      expect(context.repository(Pet).delete).not.toHaveBeenCalled();
    });
  });
});
