import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { dateRange } from '../common/date-range';
import { validatePetAppointment } from '../common/validate-pet-appointment';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { CreateWeightRecordDto } from './dto/create-weight-record.dto';
import { FindWeightRecordsQueryDto } from './dto/find-weight-records-query.dto';
import { WeightRecord } from './entities/weight-record.entity';

@Injectable()
export class WeightRecordsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(input: CreateWeightRecordDto) {
    if (input.measurementDate && input.measurementDate > new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException('La fecha de medición no puede estar en el futuro.');
    }
    await validatePetAppointment(
      this.dataSource.manager,
      input.petId,
      input.appointmentId,
    );
    const repository = this.dataSource.getRepository(WeightRecord);
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

  findAll(filters: FindWeightRecordsQueryDto = {}) {
    this.validateDateRange(filters.from, filters.to);
    const where: FindOptionsWhere<WeightRecord> = {};
    if (filters.petId !== undefined) where.petId = filters.petId;
    if (filters.appointmentId !== undefined) {
      where.appointmentId = filters.appointmentId;
    }
    const dateFilter = dateRange(filters.from, filters.to);
    if (dateFilter) where.measurementDate = dateFilter;
    return this.dataSource.getRepository(WeightRecord).find({
      where,
      relations: { pet: true, appointment: { vet: true } },
      order: { measurementDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const record = await this.dataSource.getRepository(WeightRecord).findOne({
      where: { id },
      relations: { pet: true, appointment: { vet: true } },
    });
    if (!record) throw new NotFoundException('Registro de peso no encontrado');
    return record;
  }

  private validateDateRange(from?: string, to?: string) {
    if (from && to && to < from) {
      throw new BadRequestException('La fecha final debe ser igual o posterior a la inicial.');
    }
  }
}