import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { dateRange } from '../common/date-range';
import { User } from '../users/entities/user.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FindRemindersQueryDto } from './dto/find-reminders-query.dto';
import { Reminder } from './entities/reminder.entity';

@Injectable()
export class RemindersService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(input: CreateReminderDto) {
    await this.validateRelations(input.petId, input.createdByUserId);
    const repository = this.dataSource.getRepository(Reminder);
    return repository.save(
      repository.create({
        ...input,
        remindAt: new Date(input.remindAt),
        pet: { id: input.petId } as Pet,
        createdByUser: { id: input.createdByUserId } as User,
      }),
    );
  }

  findAll(filters: FindRemindersQueryDto = {}) {
    this.validateDateRange(filters.from, filters.to);
    const where: FindOptionsWhere<Reminder> = {};
    if (filters.petId !== undefined) where.petId = filters.petId;
    if (filters.createdByUserId !== undefined) {
      where.createdByUserId = filters.createdByUserId;
    }
    if (filters.completed !== undefined) where.completed = filters.completed;
    if (filters.type) where.type = filters.type;
    const dateFilter = dateRange(
      filters.from ? new Date(filters.from) : undefined,
      filters.to ? new Date(filters.to) : undefined,
    );
    if (dateFilter) where.remindAt = dateFilter;
    return this.dataSource.getRepository(Reminder).find({
      where,
      relations: { pet: true, createdByUser: true },
      order: { remindAt: 'ASC' },
    });
  }

  async findOne(id: number) {
    const reminder = await this.dataSource.getRepository(Reminder).findOne({
      where: { id },
      relations: { pet: true, createdByUser: true },
    });
    if (!reminder) throw new NotFoundException('Recordatorio no encontrado');
    return reminder;
  }

  async update(id: number, input: UpdateReminderDto) {
    const reminder = await this.findOne(id);
    const petId = input.petId ?? reminder.petId;
    const userId = input.createdByUserId ?? reminder.createdByUserId;
    await this.validateRelations(petId, userId);

    Object.assign(reminder, input, {
      petId,
      pet: { id: petId } as Pet,
      createdByUserId: userId,
      createdByUser: { id: userId } as User,
      remindAt: input.remindAt ? new Date(input.remindAt) : reminder.remindAt,
    });
    return this.dataSource.getRepository(Reminder).save(reminder);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.getRepository(Reminder).delete(id);
    if (!result.affected) throw new NotFoundException('Recordatorio no encontrado');
  }

  private async validateRelations(petId: number, userId: number) {
    const pet = await this.dataSource.getRepository(Pet).findOneBy({
      id: petId,
      active: true,
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    const user = await this.dataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario creador no encontrado');
  }

  private validateDateRange(from?: string, to?: string) {
    if (from && to && to < from) {
      throw new BadRequestException('La fecha final debe ser igual o posterior a la inicial.');
    }
  }
}