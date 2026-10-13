import { unlink } from 'node:fs/promises';
import { NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { createDataSourceMock } from '../utils/typeorm.mock';
import { Pet } from '../../src/pets/entities/pet.entity';
import { Photo } from '../../src/pets/entities/photo.entity';
import { UpdatePhotoDto } from '../../src/photos/dto/update-photo.dto';
import { PhotosService } from '../../src/photos/photos.service';

jest.mock('node:fs/promises', () => ({
  unlink: jest.fn(),
}));

const unlinkMock = unlink as unknown as jest.Mock;

describe('PhotosService', () => {
  let service: PhotosService;
  let context: ReturnType<typeof createDataSourceMock>;

  const pet = { id: 1, active: true } as unknown as Pet;
  const storedPhoto = {
    id: 5,
    filename: 'luna-1.jpg',
    originalName: 'foto1.jpg',
    description: null,
    takenAt: new Date('2026-02-01T10:00:00.000Z'),
    pet,
  } as unknown as Photo;

  const uploadedPhoto = { filename: 'luna-1.jpg', originalName: 'foto1.jpg' };

  beforeEach(async () => {
    context = createDataSourceMock();
    unlinkMock.mockReset();
    unlinkMock.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: getDataSourceToken(), useValue: context.dataSource },
      ],
    }).compile();

    service = moduleRef.get(PhotosService);
  });

  describe('findAll', () => {
    it('consulta sin filtros y ordena de la más reciente a la más antigua', async () => {
      await service.findAll();

      expect(context.repository(Photo).find).toHaveBeenCalledWith({
        where: {},
        relations: { pet: true },
        order: { takenAt: 'DESC', id: 'DESC' },
      });
    });

    it('filtra por mascota', async () => {
      await service.findAll({ petId: 1 });

      const [options] = context.repository(Photo).find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where.pet).toEqual({ id: 1 });
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando la foto no existe', async () => {
      context.repository(Photo).findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve la foto con su mascota', async () => {
      context.repository(Photo).findOne.mockResolvedValue(storedPhoto);

      await expect(service.findOne(5)).resolves.toBe(storedPhoto);
      expect(context.repository(Photo).findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: { pet: true },
      });
    });
  });

  describe('create', () => {
    it('lanza NotFoundException y borra el archivo si la mascota no existe', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ petId: 99 }, uploadedPhoto),
      ).rejects.toThrow(NotFoundException);
      expect(unlinkMock).toHaveBeenCalledTimes(1);
      expect(context.repository(Photo).save).not.toHaveBeenCalled();
    });

    it('guarda la foto asociada a la mascota y no borra el archivo', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(pet);
      context.repository(Photo).save.mockResolvedValue(storedPhoto);
      context.repository(Photo).findOne.mockResolvedValue(storedPhoto);

      const result = await service.create({ petId: 1 }, uploadedPhoto);

      expect(context.repository(Pet).findOneBy).toHaveBeenCalledWith({
        id: 1,
        active: true,
      });
      expect(context.repository(Photo).create).toHaveBeenCalledWith({
        filename: 'luna-1.jpg',
        originalName: 'foto1.jpg',
        description: null,
        takenAt: undefined,
        pet,
      });
      expect(result).toBe(storedPhoto);
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('convierte takenAt a Date cuando viene en la petición', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(pet);
      context.repository(Photo).findOne.mockResolvedValue(storedPhoto);

      await service.create(
        { petId: 1, takenAt: '2026-02-01T10:00:00.000Z', description: 'En el parque' },
        uploadedPhoto,
      );

      expect(context.repository(Photo).create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'En el parque',
          takenAt: new Date('2026-02-01T10:00:00.000Z'),
        }),
      );
    });

    it('borra el archivo si falla el guardado', async () => {
      context.repository(Pet).findOneBy.mockResolvedValue(pet);
      context.repository(Photo).save.mockRejectedValue(new Error('fallo de base de datos'));

      await expect(service.create({ petId: 1 }, uploadedPhoto)).rejects.toThrow(
        'fallo de base de datos',
      );
      expect(unlinkMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando la foto no existe', async () => {
      context.repository(Photo).findOne.mockResolvedValue(null);

      await expect(service.update(99, { description: 'Otra' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('actualiza la descripción y la fecha', async () => {
      const photo = { ...storedPhoto };
      context.repository(Photo).findOne.mockResolvedValue(photo);

      await service.update(5, {
        description: 'En la playa',
        takenAt: '2026-03-01T08:00:00.000Z',
      });

      expect(photo.description).toBe('En la playa');
      expect(photo.takenAt).toEqual(new Date('2026-03-01T08:00:00.000Z'));
      expect(context.repository(Photo).save).toHaveBeenCalledWith(photo);
    });

    it('ignora takenAt cuando llega en null', async () => {
      const photo = { ...storedPhoto };
      context.repository(Photo).findOne.mockResolvedValue(photo);

      // El servicio se protege contra null aunque el DTO lo tipe como string.
      await service.update(5, { takenAt: null } as unknown as UpdatePhotoDto);

      expect(photo.takenAt).toEqual(storedPhoto.takenAt);
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando la foto no existe', async () => {
      context.repository(Photo).findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('borra el registro y luego el archivo', async () => {
      context.repository(Photo).findOne.mockResolvedValue(storedPhoto);

      await expect(service.remove(5)).resolves.toBeUndefined();
      expect(context.repository(Photo).remove).toHaveBeenCalledWith(storedPhoto);
      expect(unlinkMock).toHaveBeenCalledTimes(1);
    });
  });
});
