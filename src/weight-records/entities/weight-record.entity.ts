// Import TypeORM tools.
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

// Import the Pet entity.
import { Pet } from '../../pets/entities/pet.entity';

// Import the User entity.
import { User } from '../../users/entities/user.entity';

// Create the "weight_records" table.
@Entity('weight_records')
export class WeightRecord {

// Auto-generated primary key.
 @PrimaryGeneratedColumn()
 id: number;

 @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2 }) // Pet's weight in kilograms.
 weightKg: number;

 @Column({ name: 'measurement_date', type: 'date' }) // Date when the weight was measured.
 measurementDate: Date;


 // Connect the record with a pet.
 @ManyToOne(() => Pet, { nullable: false }) 
 @JoinColumn({ name: 'pet_id' })
 pet: Pet;

 // Connect the record with the vet.
 @ManyToOne(() => User, { nullable: false })
 @JoinColumn({ name: 'vet_id' })
 vet: User;
}