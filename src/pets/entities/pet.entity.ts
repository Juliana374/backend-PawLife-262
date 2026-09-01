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

 @Column({ type: 'varchar', length: 80 }) // Pet's name.
 name: string;

 @Column({ type: 'enum', enum: PetSpecies }) // Pet's species: dog or cat.
 species: PetSpecies;

 @Column({ type: 'varchar', length: 80, nullable: true }) // Pet's breed. Can be empty.
 breed: string;


 @Column({ type: 'enum', enum: PetSex, nullable: true }) // Pet's sex. Can be empty.
 sex: PetSex;

 @Column({ name: 'birth_date', type: 'date', nullable: true }) // Pet's birth date. Can be empty.
 birthDate: Date;

 @Column({ type: 'boolean', default: true }) // Pet is active by default.
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
