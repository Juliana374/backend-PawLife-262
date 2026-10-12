import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'integer' })
  roleId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'integer' })
  permissionId: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'id' })
  permission: Permission;
}
