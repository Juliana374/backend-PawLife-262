import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { User } from '../../src/users/entities/user.entity';
import { createRepositoryMock, RepositoryMock } from '../utils/typeorm.mock';
import { AuthService } from '../../src/auth/auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const compare = bcrypt.compare as unknown as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: RepositoryMock;
  let jwtService: { sign: jest.Mock };

  const storedUser = {
    id: 1,
    name: 'Ana Gómez',
    email: 'ana@pawlife.com',
    password: 'hash-guardado',
    role: {
      id: 2,
      name: 'veterinarian',
      rolePermissions: [
        { permission: { id: 1, name: 'READ_PET' } },
        { permission: { id: 2, name: 'CREATE_PET' } },
      ],
    },
  };

  beforeEach(async () => {
    usersRepository = createRepositoryMock();
    jwtService = { sign: jest.fn().mockReturnValue('token-firmado') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    compare.mockReset();
  });

  it('normaliza el correo antes de buscar al usuario', async () => {
    usersRepository.findOne.mockResolvedValue(storedUser);
    compare.mockResolvedValue(true);

    await service.login({ email: '  ANA@PawLife.com ', password: 'secreta' });

    expect(usersRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'ana@pawlife.com' } }),
    );
  });

  it('lanza UnauthorizedException cuando el usuario no existe', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@pawlife.com', password: 'secreta' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(compare).not.toHaveBeenCalled();
  });

  it('lanza UnauthorizedException cuando la contraseña no coincide', async () => {
    usersRepository.findOne.mockResolvedValue(storedUser);
    compare.mockResolvedValue(false);

    await expect(
      service.login({ email: 'ana@pawlife.com', password: 'incorrecta' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('firma el token con el rol y los permisos del usuario', async () => {
    usersRepository.findOne.mockResolvedValue(storedUser);
    compare.mockResolvedValue(true);

    const result = await service.login({
      email: 'ana@pawlife.com',
      password: 'secreta',
    });

    expect(compare).toHaveBeenCalledWith('secreta', 'hash-guardado');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      email: 'ana@pawlife.com',
      role: 'veterinarian',
      permissions: ['READ_PET', 'CREATE_PET'],
    });
    expect(result.access_token).toBe('token-firmado');
  });

  it('no expone la contraseña en la respuesta', async () => {
    usersRepository.findOne.mockResolvedValue(storedUser);
    compare.mockResolvedValue(true);

    const result = await service.login({
      email: 'ana@pawlife.com',
      password: 'secreta',
    });

    expect(result.user).not.toHaveProperty('password');
    expect(result.user).toEqual({
      id: 1,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      role: {
        id: 2,
        name: 'veterinarian',
        permissions: [
          { id: 1, name: 'READ_PET' },
          { id: 2, name: 'CREATE_PET' },
        ],
      },
    });
  });

  it('devuelve una lista vacía de permisos cuando el rol no tiene ninguno', async () => {
    usersRepository.findOne.mockResolvedValue({
      ...storedUser,
      role: { id: 3, name: 'owner', rolePermissions: [] },
    });
    compare.mockResolvedValue(true);

    const result = await service.login({
      email: 'ana@pawlife.com',
      password: 'secreta',
    });

    expect(result.user.role.permissions).toEqual([]);
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: [] }),
    );
  });
});
