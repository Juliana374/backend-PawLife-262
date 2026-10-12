import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { validatePetAppointment } from '../common/validate-pet-appointment';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { Medication } from '../medication-catalog/entities/medication.entity';
import { CreatePetMedicationDto } from './dto/create-medication.dto';
import { UpdatePetMedicationDto } from './dto/update-medication.dto';
import { FindPetMedicationsQueryDto } from './dto/find-medications-query.dto';
import { PetMedication } from './entities/medication.entity';

@Injectable()
export class PetMedicationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(input: CreatePetMedicationDto) {
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
    const medicationCatalog = await this.dataSource.getRepository(Medication).findOneBy({
      id: input.medicationCatalogId,
      isActive: true,
    });
    if (!medicationCatalog) {
      throw new NotFoundException('Medicamento activo del catálogo no encontrado');
    }
    const repository = this.dataSource.getRepository(PetMedication);
    return repository.save(
      repository.create({
        ...input,
        name: medicationCatalog.name,
        medicationCatalog,
        pet: { id: input.petId } as Pet,
        appointment: input.appointmentId
          ? ({ id: input.appointmentId } as Appointment)
          : null,
      }),
    );
  }

  findAll(filters: FindPetMedicationsQueryDto = {}) {
    this.validateDateRange(filters.from, filters.to);
    const query = this.dataSource.getRepository(PetMedication).createQueryBuilder('petMedication')
      .innerJoinAndSelect('petMedication.medicationCatalog', 'medicationCatalog')
      .leftJoinAndSelect('petMedication.pet', 'pet')
      .leftJoinAndSelect('petMedication.appointment', 'appointment')
      .leftJoinAndSelect('appointment.vet', 'vet');
    if (filters.petId !== undefined) {
      query.andWhere('petMedication.petId = :petId', { petId: filters.petId });
    }
    if (filters.appointmentId !== undefined) {
      query.andWhere('petMedication.appointmentId = :appointmentId', {
        appointmentId: filters.appointmentId,
      });
    }
    if (filters.status) {
      query.andWhere('petMedication.status = :status', { status: filters.status });
    }
    if (filters.from) {
      query.andWhere('petMedication.startDate >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('petMedication.startDate <= :to', { to: filters.to });
    }
    return query.orderBy('petMedication.startDate', 'DESC').getMany();
  }

  async findOne(id: number) {
    const medication = await this.dataSource.getRepository(PetMedication)
      .createQueryBuilder('petMedication')
      .innerJoinAndSelect('petMedication.medicationCatalog', 'medicationCatalog')
      .leftJoinAndSelect('petMedication.pet', 'pet')
      .leftJoinAndSelect('petMedication.appointment', 'appointment')
      .leftJoinAndSelect('appointment.vet', 'vet')
      .where('petMedication.id = :id', { id })
      .getOne();
    if (!medication) throw new NotFoundException('Medicamento no encontrado');
    return medication;
  }

  async update(id: number, input: UpdatePetMedicationDto) {
    const medication = await this.findOne(id);
    const petId = input.petId ?? medication.petId;
    const appointmentId = input.appointmentId !== undefined
      ? input.appointmentId
      : medication.appointmentId;
    const startDate = input.startDate ?? medication.startDate;
    const endDate = input.endDate !== undefined ? input.endDate : medication.endDate;

    if (
      input.medicationCatalogId !== undefined &&
      !Number.isInteger(input.medicationCatalogId)
    ) {
      throw new BadRequestException('El ID del medicamento del catálogo no es válido.');
    }
    const medicationCatalogId = input.medicationCatalogId ?? medication.medicationCatalogId;
    const medicationCatalog = input.medicationCatalogId !== undefined
      ? await this.dataSource.getRepository(Medication).findOneBy({
          id: medicationCatalogId,
          isActive: true,
        })
      : medication.medicationCatalog;
    if (!medicationCatalog) {
      throw new NotFoundException('Medicamento activo del catálogo no encontrado');
    }

    await validatePetAppointment(this.dataSource.manager, petId, appointmentId);
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de finalización debe ser igual o posterior al inicio.',
      );
    }

    Object.assign(medication, input, {
      name: input.medicationCatalogId !== undefined ? medicationCatalog.name : medication.name,
      medicationCatalogId,
      medicationCatalog,
      petId,
      pet: { id: petId } as Pet,
      appointmentId,
      appointment: appointmentId ? ({ id: appointmentId } as Appointment) : null,
      startDate,
      endDate,
    });
    return this.dataSource.getRepository(PetMedication).save(medication);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.getRepository(PetMedication).delete(id);
    if (!result.affected) throw new NotFoundException('Medicamento no encontrado');
  }

  private validateDateRange(from?: string, to?: string) {
    if (from && to && to < from) {
      throw new BadRequestException('La fecha final debe ser igual o posterior a la inicial.');
    }
  }
}
