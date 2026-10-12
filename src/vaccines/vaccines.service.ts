import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { dateRange } from '../common/date-range';
import { validatePetAppointment } from '../common/validate-pet-appointment';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { FindVaccinesQueryDto } from './dto/find-vaccines-query.dto';
import { Vaccine } from './entities/vaccine.entity';

@Injectable()
export class VaccinesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(input: CreateVaccineDto) {
    const applicationDate = input.applicationDate ?? new Date().toISOString().slice(0, 10);
    if (input.nextDoseDate && input.nextDoseDate < applicationDate) {
      throw new BadRequestException(
        'La próxima dosis debe ser igual o posterior a la aplicación.',
      );
    }
    await validatePetAppointment(
      this.dataSource.manager,
      input.petId,
      input.appointmentId,
    );
    const repository = this.dataSource.getRepository(Vaccine);
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

  findAll(filters: FindVaccinesQueryDto = {}) {
    this.validateDateRange(filters.from, filters.to);
    const where: FindOptionsWhere<Vaccine> = {};
    if (filters.petId !== undefined) where.petId = filters.petId;
    if (filters.appointmentId !== undefined) {
      where.appointmentId = filters.appointmentId;
    }
    const dateFilter = dateRange(filters.from, filters.to);
    if (dateFilter) where.applicationDate = dateFilter;
    return this.dataSource.getRepository(Vaccine).find({
      where,
      relations: { pet: true, appointment: { vet: true } },
      order: { applicationDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const vaccine = await this.dataSource.getRepository(Vaccine).findOne({
      where: { id },
      relations: { pet: true, appointment: { vet: true } },
    });
    if (!vaccine) throw new NotFoundException('Vacuna no encontrada');
    return vaccine;
  }

  async update(id: number, input: UpdateVaccineDto) {
    const vaccine = await this.findOne(id);
    const petId = input.petId ?? vaccine.petId;
    const appointmentId = input.appointmentId !== undefined
      ? input.appointmentId
      : vaccine.appointmentId;
    const applicationDate = input.applicationDate ?? vaccine.applicationDate;
    const nextDoseDate = input.nextDoseDate !== undefined
      ? input.nextDoseDate
      : vaccine.nextDoseDate;

    await validatePetAppointment(this.dataSource.manager, petId, appointmentId);
    if (nextDoseDate && nextDoseDate < applicationDate) {
      throw new BadRequestException(
        'La próxima dosis debe ser igual o posterior a la aplicación.',
      );
    }

    Object.assign(vaccine, input, {
      petId,
      pet: { id: petId } as Pet,
      appointmentId,
      appointment: appointmentId ? ({ id: appointmentId } as Appointment) : null,
      applicationDate,
      nextDoseDate,
    });
    return this.dataSource.getRepository(Vaccine).save(vaccine);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.getRepository(Vaccine).delete(id);
    if (!result.affected) throw new NotFoundException('Vacuna no encontrada');
  }

  private validateDateRange(from?: string, to?: string) {
    if (from && to && to < from) {
      throw new BadRequestException('La fecha final debe ser igual o posterior a la inicial.');
    }
  }
}