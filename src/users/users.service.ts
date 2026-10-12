import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ILike, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserDto) {
    const email = input.email.trim().toLowerCase();
    const role = await this.usersRepository.manager
      .getRepository(Role)
      .findOneBy({ id: input.roleId });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (await this.usersRepository.findOneBy({ email })) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    const user = this.usersRepository.create({
      name: input.name.trim(),
      email,
      password: await bcrypt.hash(input.password, 10),
      phone: input.phone ?? null,
      role,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.findOne(savedUser.id);
  }

  async findAll(filters: FindUsersQueryDto = {}) {
    return this.usersRepository.find({
      where: {
        ...(filters.name && { name: ILike(`%${filters.name}%`) }),
        ...(filters.email && { email: ILike(`%${filters.email}%`) }),
        ...(filters.roleId && { role: { id: filters.roleId } }),
      },
      relations: { role: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    return this.getUser(id);
  }

  async update(id: number, input: UpdateUserDto) {
    const user = await this.getUser(id);

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      const existingUser = await this.usersRepository.findOneBy({ email });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
      user.email = email;
    }

    if (input.name !== undefined) {
      user.name = input.name.trim();
    }
    if (input.phone !== undefined) {
      user.phone = input.phone;
    }
    if (input.password !== undefined) {
      user.password = await bcrypt.hash(input.password, 10);
    }
    if (input.roleId !== undefined) {
      const role = await this.usersRepository.manager
        .getRepository(Role)
        .findOneBy({ id: input.roleId });
      if (!role) throw new NotFoundException('Rol no encontrado');
      user.role = role;
    }

    const savedUser = await this.usersRepository.save(user);
    return this.findOne(savedUser.id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  private async getUser(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

}