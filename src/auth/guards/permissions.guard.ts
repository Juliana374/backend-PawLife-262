import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AppPermission } from '../enums/app-permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get<AppPermission[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { permissions?: string[] };
    }>();
    if (!request.user) {
      throw new UnauthorizedException('Token no validado');
    }

    if (!permissions.every((permission) => request.user?.permissions?.includes(permission))) {
      throw new ForbiddenException('No tienes permisos para esta operación');
    }

    return true;
  }
}