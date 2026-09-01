// Import TypeORM tools.
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

// Import the Pet entity.
import { Pet } from '../../pets/entities/pet.entity';

// Import the User entity.
import { User } from '../../users/entities/user.entity';

// Create the "photos" table.
@Entity('photos')
export class Photo {

// Auto-generated primary key.
 @PrimaryGeneratedColumn()
 id: number;


 @Column({ type: 'varchar', length: 255 })  // Photo URL.
 url: string;
 @Column({ type: 'varchar', length: 255, nullable: true }) // Photo description. Can be empty.
 description: string;
 @Column({ name: 'taken_at', type: 'date' })  // Date when the photo was taken.
 takenAt: Date;

// Connect the photo with a pet.
 @ManyToOne(() => Pet, { nullable: false })
 @JoinColumn({ name: 'pet_id' })
 pet: Pet;


// Connect the photo with the uploader.
// It can be the owner or the vet.
 @ManyToOne(() => User, { nullable: false })
 @JoinColumn({ name: 'user_id' })
 user: User;
}
