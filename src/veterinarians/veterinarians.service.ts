import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ILike } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { Veterinarian } from './entities/veterinarian.entity';
import { FindVeterinariansQueryDto } from './dto/find-veterinarians-query.dto';

@Injectable()
export class VeterinariansService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(input: CreateVeterinarianDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOneBy({ id: input.userId });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      const repository = manager.getRepository(Veterinarian);
      if (await repository.findOneBy({ userId: input.userId })) {
        throw new ConflictException('El usuario ya tiene un perfil veterinario');
      }
      if (await repository.findOneBy({ licenseNumber: input.licenseNumber })) {
        throw new ConflictException('El número de licencia ya está registrado');
      }
      return repository.save(repository.create({ ...input, user }));
    });
  }

  findAll(filters: FindVeterinariansQueryDto = {}) {
    const where = {
      ...(filters.specialty && { specialty: ILike(`%${filters.specialty}%`) }),
      ...(filters.name && { user: { name: ILike(`%${filters.name}%`) } }),
    };
    return this.dataSource.getRepository(Veterinarian).find({
      where,
      relations: { user: true },
      order: { userId: 'ASC' },
    });
  }

  async findOne(userId: number) {
    const veterinarian = await this.dataSource.getRepository(Veterinarian).findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!veterinarian) throw new NotFoundException('Veterinario no encontrado');
    return veterinarian;
  }

  async update(userId: number, input: UpdateVeterinarianDto) {
    const veterinarian = await this.findOne(userId);
    if (input.licenseNumber !== undefined) {
      const existing = await this.dataSource.getRepository(Veterinarian).findOneBy({
        licenseNumber: input.licenseNumber,
      });
      if (existing && existing.userId !== userId) {
        throw new ConflictException('El número de licencia ya está registrado');
      }
      veterinarian.licenseNumber = input.licenseNumber;
    }
    if (input.specialty !== undefined) veterinarian.specialty = input.specialty;
    return this.dataSource.getRepository(Veterinarian).save(veterinarian);
  }
}