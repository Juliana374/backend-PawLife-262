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

@Index('idx_vaccines_pet_id', ['pet'])
@Check('"next_dose_date" IS NULL OR "next_dose_date" >= "application_date"')
@Entity('vaccines')
export class Vaccine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'application_date', type: 'date', default: () => 'CURRENT_DATE' })
  applicationDate: string;

  @Column({ name: 'next_dose_date', type: 'date', nullable: true })
  nextDoseDate: string | null;

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