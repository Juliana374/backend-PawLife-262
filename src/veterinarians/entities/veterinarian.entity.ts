import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('veterinarians')
export class Veterinarian {
  @PrimaryColumn({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'license_number', type: 'varchar', length: 50, unique: true })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialty: string | null;

  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}