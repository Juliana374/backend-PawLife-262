import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createExecutionContext } from '../../../test/utils/execution-context.mock';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('lanza UnauthorizedException cuando no hay encabezado Authorization', async () => {
    const context = createExecutionContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('lanza UnauthorizedException cuando el esquema no es Bearer', async () => {
    const context = createExecutionContext({ headers: { authorization: 'Basic abc' } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('lanza UnauthorizedException cuando falta el token', async () => {
    const context = createExecutionContext({ headers: { authorization: 'Bearer' } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('lanza UnauthorizedException cuando el token es inválido o expiró', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const context = createExecutionContext({ headers: { authorization: 'Bearer token' } });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('acepta el token y adjunta el payload a la petición', async () => {
    const payload = {
      sub: 1,
      email: 'ana@pawlife.com',
      role: 'veterinarian',
      permissions: ['READ_PET'],
    };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer token' },
    };

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token');
    expect(request.user).toEqual(payload);
  });

  it('acepta el esquema bearer sin importar mayúsculas', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
    const context = createExecutionContext({ headers: { authorization: 'bearer token' } });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
