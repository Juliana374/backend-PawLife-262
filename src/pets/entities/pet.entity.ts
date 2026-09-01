// Import TypeORM tools.
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

// Import the User entity.
import { User } from '../../users/entities/user.entity';

// Allowed pet species.
export enum PetSpecies { DOG = 'dog', CAT = 'cat' }

// Allowed pet sexes.
export enum PetSex { MALE = 'male', FEMALE = 'female' }

// Create the "pets" table.
@Entity('pets')
export class Pet {

// Auto-generated primary key.
 @PrimaryGeneratedColumn()
 id: number;

// Pet's name.
 @Column({ type: 'varchar', length: 80 })
 name: string;

// Pet's species: dog or cat.
 @Column({ type: 'enum', enum: PetSpecies })
 species: PetSpecies;

// Pet's breed. Can be empty.
 @Column({ type: 'varchar', length: 80, nullable: true })
 breed: string;

// Pet's sex. Can be empty.
 @Column({ type: 'enum', enum: PetSex, nullable: true })
 sex: PetSex;

// Pet's birth date. Can be empty.
 @Column({ name: 'birth_date', type: 'date', nullable: true })
 birthDate: Date;

// Pet is active by default.
 @Column({ type: 'boolean', default: true })
 active: boolean;


// Connect the pet with its owner.
 @ManyToOne(() => User, { nullable: false })
 @JoinColumn({ name: 'owner_id' })
 owner: User;
 
// Connect the pet with its vet.
 @ManyToOne(() => User, { nullable: false })
 @JoinColumn({ name: 'vet_id' })
 vet: User;
}
