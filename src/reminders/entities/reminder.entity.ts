import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';

/** Where the reminder comes from, so the app can group and filter them. */
export enum ReminderType {
  VACCINE = 'vaccine',
  MEDICATION = 'medication',
  APPOINTMENT = 'appointment',
  OTHER = 'other',
}

/**
 * A care activity scheduled by the veterinarian for a pet.
 * The owner reads it, marks it as done, and gets notified when it is due.
 */
@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** When the owner should be notified. */
  @Column({ name: 'remind_at', type: 'timestamp' })
  remindAt: Date;

  @Column({ type: 'enum', enum: ReminderType, default: ReminderType.OTHER })
  type: ReminderType;

  /** Lets the owner tick it off without deleting it. */
  @Column({ type: 'boolean', default: false })
  completed: boolean;

  /** Prevents sending the same notification twice. */
  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @ManyToOne(() => Pet, { nullable: false })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'vet_id' })
  vet: User;
}