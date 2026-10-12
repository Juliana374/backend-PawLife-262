import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('medication_catalog')
export class Medication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'active_ingredient', type: 'varchar', length: 120, nullable: true })
  activeIngredient: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  concentration: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  presentation: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}