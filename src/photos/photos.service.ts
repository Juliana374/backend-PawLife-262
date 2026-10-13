import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { getUploadDirectory } from '../common/upload-directory';
import { Pet } from '../pets/entities/pet.entity';
import { Photo } from '../pets/entities/photo.entity';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { FindPhotosQueryDto } from './dto/find-photos-query.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  findAll(filters: FindPhotosQueryDto = {}) {
    const where: FindOptionsWhere<Photo> = {};
    if (filters.petId !== undefined) where.pet = { id: filters.petId };

    return this.dataSource.getRepository(Photo).find({
      where,
      relations: { pet: true },
      order: { takenAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const photo = await this.dataSource.getRepository(Photo).findOne({
      where: { id },
      relations: { pet: true },
    });
    if (!photo) throw new NotFoundException('Foto no encontrada');
    return photo;
  }

  async create(input: CreatePhotoDto, uploadedPhoto: UploadedPhoto) {
    try {
      const pet = await this.dataSource.getRepository(Pet).findOneBy({
        id: input.petId,
        active: true,
      });
      if (!pet) throw new NotFoundException('Mascota no encontrada');

      const repository = this.dataSource.getRepository(Photo);
      const photo = await repository.save(
        repository.create({
          filename: uploadedPhoto.filename,
          originalName: uploadedPhoto.originalName,
          description: input.description ?? null,
          takenAt: input.takenAt ? new Date(input.takenAt) : undefined,
          pet,
        }),
      );
      return this.findOne(photo.id);
    } catch (error) {
      await this.removeFile(uploadedPhoto.filename);
      throw error;
    }
  }

  async update(id: number, input: UpdatePhotoDto) {
    const repository = this.dataSource.getRepository(Photo);
    const photo = await this.findOne(id);
    if (input.description !== undefined) photo.description = input.description;
    if (input.takenAt !== undefined && input.takenAt !== null) {
      photo.takenAt = new Date(input.takenAt);
    }
    await repository.save(photo);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const photo = await this.findOne(id);
    await this.dataSource.getRepository(Photo).remove(photo);
    await this.removeFile(photo.filename);
  }

  private async removeFile(filename: string) {
    try {
      await unlink(join(getUploadDirectory(), basename(filename)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error(`No se pudo eliminar el archivo ${filename}`, error);
      }
    }
  }
}

export interface UploadedPhoto {
  filename: string;
  originalName: string;
}