import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createExecutionContext } from '../../../test/utils/execution-context.mock';
import { AppPermission } from '../enums/app-permission.enum';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { get: jest.Mock };

  beforeEach(() => {
    reflector = { get: jest.fn() };
    guard = new PermissionsGuard(reflector as unknown as Reflector);
  });

  it('permite el acceso cuando el endpoint no exige permisos', () => {
    reflector.get.mockReturnValue(undefined);

    expect(guard.canActivate(createExecutionContext({}))).toBe(true);
  });

  it('permite el acceso cuando la lista de permisos está vacía', () => {
    reflector.get.mockReturnValue([]);

    expect(guard.canActivate(createExecutionContext({}))).toBe(true);
  });

  it('lee los permisos desde los metadatos del handler', () => {
    reflector.get.mockReturnValue([AppPermission.READ_PET]);
    const handler = () => undefined;
    const context = createExecutionContext(
      { user: { permissions: [AppPermission.READ_PET] } },
      handler,
    );

    guard.canActivate(context);

    expect(reflector.get).toHaveBeenCalledWith(PERMISSIONS_KEY, handler);
  });

  it('lanza UnauthorizedException cuando la petición no tiene usuario', () => {
    reflector.get.mockReturnValue([AppPermission.READ_PET]);

    expect(() => guard.canActivate(createExecutionContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('lanza ForbiddenException cuando falta alguno de los permisos', () => {
    reflector.get.mockReturnValue([AppPermission.READ_PET, AppPermission.UPDATE_PET]);
    const context = createExecutionContext({
      user: { permissions: [AppPermission.READ_PET] },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('permite el acceso cuando el usuario tiene todos los permisos', () => {
    reflector.get.mockReturnValue([AppPermission.READ_PET, AppPermission.UPDATE_PET]);
    const context = createExecutionContext({
      user: { permissions: [AppPermission.READ_PET, AppPermission.UPDATE_PET] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
