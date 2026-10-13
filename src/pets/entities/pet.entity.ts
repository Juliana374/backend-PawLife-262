import {
	Check,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Photo } from './photo.entity';

export enum PetSpecies {
	DOG = 'dog',
	CAT = 'cat',
	BIRD = 'bird',
	RABBIT = 'rabbit',
	OTHER = 'other',
}

export enum PetSex {
	MALE = 'male',
	FEMALE = 'female',
}

@Index('idx_pets_owner_id', ['owner'])
@Check('"birth_date" IS NULL OR "birth_date" <= CURRENT_DATE')
@Entity('pets')
export class Pet {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 80 })
	name: string;

	@Column({ type: 'enum', enum: PetSpecies, enumName: 'pets_species_enum' })
	species: PetSpecies;

	@Column({ type: 'varchar', length: 80, nullable: true })
	breed: string | null;

	@Column({ type: 'enum', enum: PetSex, enumName: 'pets_sex_enum', nullable: true })
	sex: PetSex | null;

	@Column({ name: 'birth_date', type: 'date', nullable: true })
	birthDate: Date | null;

	@Column({ type: 'boolean', default: true })
	active: boolean;

	@ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
	@JoinColumn({ name: 'owner_id' })
	owner: User;

	@OneToMany(() => Photo, (photo) => photo.pet)
	photos: Photo[];

	@Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	updatedAt: Date;
}
