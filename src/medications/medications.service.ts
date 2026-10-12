import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { dateRange } from '../common/date-range';
import { validatePetAppointment } from '../common/validate-pet-appointment';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { FindMedicationsQueryDto } from './dto/find-medications-query.dto';
import { Medication } from './entities/medication.entity';

@Injectable()
export class MedicationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(input: CreateMedicationDto) {
    const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);
    if (input.endDate && input.endDate < startDate) {
      throw new BadRequestException(
        'La fecha de finalización debe ser igual o posterior al inicio.',
      );
    }
    await validatePetAppointment(
      this.dataSource.manager,
      input.petId,
      input.appointmentId,
    );
    const repository = this.dataSource.getRepository(Medication);
    return repository.save(
      repository.create({
        ...input,
        pet: { id: input.petId } as Pet,
        appointment: input.appointmentId
          ? ({ id: input.appointmentId } as Appointment)
          : null,
      }),
    );
  }

  findAll(filters: FindMedicationsQueryDto = {}) {
    this.validateDateRange(filters.from, filters.to);
    const where: FindOptionsWhere<Medication> = {};
    if (filters.petId !== undefined) where.petId = filters.petId;
    if (filters.appointmentId !== undefined) {
      where.appointmentId = filters.appointmentId;
    }
    if (filters.status) where.status = filters.status;
    const dateFilter = dateRange(filters.from, filters.to);
    if (dateFilter) where.startDate = dateFilter;
    return this.dataSource.getRepository(Medication).find({
      where,
      relations: { pet: true, appointment: { vet: true } },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const medication = await this.dataSource.getRepository(Medication).findOne({
      where: { id },
      relations: { pet: true, appointment: { vet: true } },
    });
    if (!medication) throw new NotFoundException('Medicamento no encontrado');
    return medication;
  }

  async update(id: number, input: UpdateMedicationDto) {
    const medication = await this.findOne(id);
    const petId = input.petId ?? medication.petId;
    const appointmentId = input.appointmentId !== undefined
      ? input.appointmentId
      : medication.appointmentId;
    const startDate = input.startDate ?? medication.startDate;
    const endDate = input.endDate !== undefined ? input.endDate : medication.endDate;

    await validatePetAppointment(this.dataSource.manager, petId, appointmentId);
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de finalización debe ser igual o posterior al inicio.',
      );
    }

    Object.assign(medication, input, {
      petId,
      pet: { id: petId } as Pet,
      appointmentId,
      appointment: appointmentId ? ({ id: appointmentId } as Appointment) : null,
      startDate,
      endDate,
    });
    return this.dataSource.getRepository(Medication).save(medication);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.getRepository(Medication).delete(id);
    if (!result.affected) throw new NotFoundException('Medicamento no encontrado');
  }

  private validateDateRange(from?: string, to?: string) {
    if (from && to && to < from) {
      throw new BadRequestException('La fecha final debe ser igual o posterior a la inicial.');
    }
  }
}