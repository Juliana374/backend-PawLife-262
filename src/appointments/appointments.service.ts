import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Not } from 'typeorm';
import { dateRange } from '../common/date-range';
import { Veterinarian } from '../veterinarians/entities/veterinarian.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';

@Injectable()
export class AppointmentsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  create(input: CreateAppointmentDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.validateRelations(manager, input.petId, input.vetId);
      const appointmentDate = new Date(input.appointmentDate);
      const repository = manager.getRepository(Appointment);
      const existingAppointment = await repository.findOne({
        where: [
          {
            vetId: input.vetId,
            appointmentDate,
            status: Not(AppointmentStatus.CANCELLED),
          },
          {
            petId: input.petId,
            appointmentDate,
            status: Not(AppointmentStatus.CANCELLED),
          },
        ],
      });
      
      if (existingAppointment) {
        throw new ConflictException(
          'Ya existe una cita programada en ese horario.',
        );
      }

      return repository.save(
        repository.create({
          ...input,
          appointmentDate,
          pet: { id: input.petId } as Pet,
          vet: { userId: input.vetId } as Veterinarian,
        }),
      );
    });
  }

  findAll(filters: FindAppointmentsQueryDto = {}) {
    this.validateDateRange(filters.from, filters.to);
    const where: FindOptionsWhere<Appointment> = {};
    if (filters.petId !== undefined) where.petId = filters.petId;
    if (filters.vetId !== undefined) where.vetId = filters.vetId;
    if (filters.status) where.status = filters.status;
    const dateFilter = dateRange(
      filters.from ? new Date(filters.from) : undefined,
      filters.to ? new Date(filters.to) : undefined,
    );
    if (dateFilter) where.appointmentDate = dateFilter;
    return this.dataSource.getRepository(Appointment).find({
      where,
      relations: { pet: true, vet: { user: true } },
      order: { appointmentDate: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.getAppointment(id, this.dataSource.manager);
  }

  update(id: number, input: UpdateAppointmentDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.getAppointment(id, manager);
      const petId = input.petId ?? appointment.petId;
      const vetId = input.vetId ?? appointment.vet.userId;
      await this.validateRelations(manager, petId, vetId);

      if (input.appointmentDate) {
        appointment.appointmentDate = new Date(input.appointmentDate);
      }
      if (input.reason !== undefined) appointment.reason = input.reason;
      if (input.status !== undefined) appointment.status = input.status;
      if (input.diagnosis !== undefined)
        appointment.diagnosis = input.diagnosis;
      if (input.instructions !== undefined)
        appointment.instructions = input.instructions;
      appointment.petId = petId;
      appointment.vetId = vetId;
      appointment.pet = { id: petId } as Pet;
      appointment.vet = { userId: vetId } as Veterinarian;

      return manager.getRepository(Appointment).save(appointment);
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.getRepository(Appointment).delete(id);
    if (!result.affected) throw new NotFoundException('Cita no encontrada');
  }

  private async getAppointment(
    id: number,
    manager: import('typeorm').EntityManager,
  ) {
    const appointment = await manager.getRepository(Appointment).findOne({
      where: { id },
      relations: { pet: true, vet: { user: true } },
    });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    return appointment;
  }

  private async validateRelations(
    manager: import('typeorm').EntityManager,
    petId: number,
    vetId: number,
  ) {
    const pet = await manager
      .getRepository(Pet)
      .findOneBy({ id: petId, active: true });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    const vet = await manager
      .getRepository(Veterinarian)
      .findOneBy({ userId: vetId });
    if (!vet) throw new NotFoundException('Veterinario no encontrado');
  }

  private validateDateRange(from?: string, to?: string) {
    if (from && to && to < from) {
      throw new BadRequestException(
        'La fecha final debe ser igual o posterior a la inicial.',
      );
    }
  }
}
