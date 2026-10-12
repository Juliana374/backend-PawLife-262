import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from './pet.entity';

@Index('idx_photos_pet_id', ['pet'])
@Entity('photos')
export class Photo {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 255 })
	filename: string;

	@Column({ name: 'original_name', type: 'varchar', length: 255 })
	originalName: string;

	@Column({ type: 'varchar', length: 255, nullable: true })
	description: string | null;

	@Column({ name: 'taken_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	takenAt: Date;

	@ManyToOne(() => Pet, (pet) => pet.photos, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'pet_id' })
	pet: Pet;
}