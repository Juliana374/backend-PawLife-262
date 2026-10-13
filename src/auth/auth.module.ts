import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from './entities/permission.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User,Role,RolePermission,Permission]),
    JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService:ConfigService) => {
          const secret = configService.getOrThrow<string>('JWT_SECRET');
          if (configService.get<string>('NODE_ENV') === 'production' && secret.length < 32) {
            throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
          }
            return {
                secret,
                signOptions: { expiresIn: '1h' },
            };
        },
    }),
  ],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [JwtModule, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
