import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Pet } from '../../pets/entities/pet.entity';
import { Veterinarian } from '../../veterinarians/entities/veterinarian.entity';
import { Vaccine } from '../../vaccines/entities/vaccine.entity';
import { PetMedication } from '../../pets-medication/entities/medication.entity';
import { WeightRecord } from '../../weight-records/entities/weight-record.entity';

export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Index('idx_appointments_pet_id', ['pet'])
@Index('idx_appointments_vet_id', ['vet'])
@Index('idx_appointments_date', ['appointmentDate'])
@Entity('appointments')
export class Appointment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'appointment_date', type: 'timestamptz' })
    appointmentDate: Date;

    @Column({ type: 'varchar', length: 150 })
    reason: string;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        enumName: 'appointments_status_enum',
        default: AppointmentStatus.SCHEDULED
    })
    status: AppointmentStatus;

    @Column({ type: 'text', nullable: true })
    diagnosis: string | null;

    @Column({ type: 'text', nullable: true })
    instructions: string | null;

    @ManyToOne(() => Pet, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'pet_id' })
    pet: Pet;

    @Column({ name: 'pet_id', type: 'integer' })
    petId: number;

    @ManyToOne(() => Veterinarian, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'vet_id' })
    vet: Veterinarian;

    @Column({ name: 'vet_id', type: 'integer' })
    vetId: number;

    @OneToMany(() => Vaccine, (vaccine) => vaccine.appointment)
    vaccines: Vaccine[];

    @OneToMany(() => PetMedication, (medication) => medication.appointment)
    medications: PetMedication[];

    @OneToMany(() => WeightRecord, (weightRecord) => weightRecord.appointment)
    weightRecords: WeightRecord[];

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}