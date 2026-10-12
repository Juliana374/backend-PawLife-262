import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';

export enum ReminderType {
  VACCINE = 'vaccine',
  MEDICATION = 'medication',
  CHECKUP = 'checkup',
  DEWORMING = 'deworming',
  OTHER = 'other',
}

@Index('idx_reminders_pet_id', ['pet'])
@Index('idx_reminders_remind_at', ['remindAt'], { where: '"completed" = false' })
@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'remind_at', type: 'timestamptz' })
  remindAt: Date;

  @Column({
    type: 'enum',
    enum: ReminderType,
    enumName: 'reminders_type_enum',
    default: ReminderType.OTHER,
  })
  type: ReminderType;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @ManyToOne(() => Pet, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ name: 'pet_id', type: 'integer' })
  petId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @Column({ name: 'created_by_user_id', type: 'integer' })
  createdByUserId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}