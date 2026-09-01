import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';

@Entity('vaccines')
export class Vaccine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'application_date', type: 'date' })
  applicationDate: Date;

  @Column({ name: 'next_dose_date', type: 'date', nullable: true })
  nextDoseDate: Date;

  @ManyToOne(() => Pet, { nullable: false })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'vet_id' })
  vet: User;
}