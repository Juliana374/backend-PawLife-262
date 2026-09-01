// Import the tools needed to create the table and its relationships
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

// Import the Pet and User entities
import { Pet } from '../../pets/entities/pet.entity';
import { User } from '../../users/entities/user.entity';

// Possible statuses for an appointment
export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

// This class represents the "appointments" table in the database
@Entity('appointments')
export class Appointment {

    // Unique ID for each appointment
    @PrimaryGeneratedColumn()
    id: number;

    // Date and time of the appointment
    @Column({ name: 'appointment_date', type: 'timestamp' })
    appointmentDate: Date;

    // Reason for the appointment
    @Column({ type: 'varchar', length: 150 })
    reason: string;

    // Current status of the appointment
    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.SCHEDULED
    })
    status: AppointmentStatus;

    // Notes that the veterinarian can add after the appointment
    @Column({ type: 'text', nullable: true })
    notes: string;

    // Instructions given to the pet owner
    @Column({ type: 'text', nullable: true })
    instructions: string;

    // Connects the appointment with the pet being treated
    @ManyToOne(() => Pet, { nullable: false })
    @JoinColumn({ name: 'pet_id' })
    pet: Pet;

    // Connects the appointment with the veterinarian in charge
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'vet_id' })
    vet: User;
}