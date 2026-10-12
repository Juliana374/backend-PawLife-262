import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { expectNoPassword } from '../../test/utils/controller-testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: { login: jest.Mock };

  const loginResult = {
    access_token: 'token-firmado',
    user: {
      id: 1,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      role: {
        id: 2,
        name: 'veterinarian',
        permissions: [{ id: 1, name: 'READ_PET' }],
      },
    },
  };

  beforeEach(async () => {
    service = { login: jest.fn().mockResolvedValue(loginResult) };

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('devuelve el token y el usuario dentro del envelope', async () => {
    const input = { email: 'ana@pawlife.com', password: 'secreta' };

    const result = await controller.login(input);

    expect(service.login).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      status: 'ok',
      data: {
        access_token: 'token-firmado',
        user: loginResult.user,
      },
    });
    expectNoPassword(result);
  });

  it('propaga el error de credenciales inválidas', async () => {
    service.login.mockRejectedValue(new UnauthorizedException());

    await expect(
      controller.login({ email: 'ana@pawlife.com', password: 'mala' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
