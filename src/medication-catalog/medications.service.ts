import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { Medication } from './entities/medication.entity';

@Injectable()
export class MedicationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  findAll() {
    return this.dataSource.getRepository(Medication).find({
      order: { name: 'ASC' },
    });
  }

  async create(input: CreateMedicationDto) {
    const repository = this.dataSource.getRepository(Medication);
    return repository.save(repository.create(input));
  }

  async findOne(id: number) {
    const medication = await this.dataSource.getRepository(Medication).findOne({
      where: { id },
    });
    if (!medication) throw new NotFoundException('Medicamento no encontrado');
    return medication;
  }

  async update(id: number, input: UpdateMedicationDto) {
    const medication = await this.findOne(id);
    Object.assign(medication, input);
    return this.dataSource.getRepository(Medication).save(medication);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.getRepository(Medication).delete(id);
    if (!result.affected) throw new NotFoundException('Medicamento no encontrado');
  }
}