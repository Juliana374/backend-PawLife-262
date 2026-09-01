import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Roles available in the system.
 * A veterinarian creates and manages the clinical information;
 * an owner only reads it and receives the reminders.
 */
export enum UserRole {
  VETERINARIAN = 'veterinarian',
  OWNER = 'owner',
}

/**
 * Represents any person who uses the application.
 *
 * Owners and veterinarians share the same login data, so they are stored
 * in a single table and told apart by the `role` column. Creating two
 * separate tables would duplicate the authentication logic and make it
 * impossible to guarantee a unique email across both.
 *
 * The table is named `users` in plural because `user` is a reserved
 * keyword in PostgreSQL.
 */
@Entity('users')
export class User {
  /** Auto-incremented primary key (SERIAL in PostgreSQL). */
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Used to log in, so no two accounts can share the same email. */
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  /** Stored hashed, never in plain text. */
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /** Optional: mainly the owner's contact number for the clinic. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  /** Defines what the user is allowed to create, edit and delete. */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.OWNER })
  role: UserRole;
}