import {
	Check,
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Index('idx_weight_records_pet_id', ['pet'])
@Check('"weight_kg" > 0')
@Check('"measurement_date" <= CURRENT_DATE')
@Entity('weight_records')
export class WeightRecord {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		name: 'weight_kg',
		type: 'numeric',
		precision: 5,
		scale: 2,
		transformer: {
			to: (value: number) => value,
			from: (value: string | number) => Number(value),
		},
	})
	weightKg: number;

	@Column({ name: 'measurement_date', type: 'date', default: () => 'CURRENT_DATE' })
	measurementDate: string;

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
}