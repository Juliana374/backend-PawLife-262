import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Medication } from '../../medication-catalog/entities/medication.entity';

export enum PetMedicationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued',
}

@Index('idx_medications_pet_id', ['pet'])
@Index('idx_medications_medication_catalog_id', ['medicationCatalog'])
@Check('"end_date" IS NULL OR "end_date" >= "start_date"')
@Entity('medications')
export class PetMedication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  dose: string;

  @Column({ type: 'varchar', length: 50 })
  schedule: string;

  @Column({ name: 'start_date', type: 'date', default: () => 'CURRENT_DATE' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null;

  @Column({
    type: 'enum',
    enum: PetMedicationStatus,
    enumName: 'medications_status_enum',
    default: PetMedicationStatus.ACTIVE,
  })
  status: PetMedicationStatus;

  @ManyToOne(() => Medication, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medication_catalog_id' })
  medicationCatalog: Medication;

  @Column({ name: 'medication_catalog_id' })
  medicationCatalogId: number;

  @ManyToOne(() => Pet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ name: 'pet_id' })
  petId: number;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment | null;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
