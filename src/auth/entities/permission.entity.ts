import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 }) 
  name: string;

  @Column({ length: 255 })
  description: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  ) 
  rolePermissions: RolePermission[];
}
