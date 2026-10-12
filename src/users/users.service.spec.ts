import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createRepositoryMock, RepositoryMock } from '../../test/utils/typeorm.mock';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const hash = bcrypt.hash as unknown as jest.Mock;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: RepositoryMock & { manager: { getRepository: jest.Mock } };
  let rolesRepository: RepositoryMock;

  const role = { id: 2, name: 'owner' };
  const storedUser = {
    id: 10,
    name: 'Ana Gómez',
    email: 'ana@pawlife.com',
    password: 'hash-guardado',
    phone: null,
    role,
  };

  beforeEach(async () => {
    rolesRepository = createRepositoryMock();
    usersRepository = Object.assign(createRepositoryMock(), {
      manager: { getRepository: jest.fn(() => rolesRepository) },
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    hash.mockReset();
    hash.mockResolvedValue('hash-generado');
  });

  describe('create', () => {
    const input = {
      name: '  Ana Gómez  ',
      email: '  ANA@PawLife.com ',
      password: 'secreta',
      roleId: 2,
    };

    it('lanza NotFoundException cuando el rol no existe', async () => {
      rolesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(NotFoundException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('lanza ConflictException cuando el correo ya está registrado', async () => {
      rolesRepository.findOneBy.mockResolvedValue(role);
      usersRepository.findOneBy.mockResolvedValue(storedUser);

      await expect(service.create(input)).rejects.toThrow(ConflictException);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'ana@pawlife.com',
      });
    });

    it('normaliza los datos, cifra la contraseña y devuelve el usuario creado', async () => {
      rolesRepository.findOneBy.mockResolvedValue(role);
      usersRepository.findOneBy.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(storedUser);
      usersRepository.findOne.mockResolvedValue(storedUser);

      const result = await service.create(input);

      expect(hash).toHaveBeenCalledWith('secreta', 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        name: 'Ana Gómez',
        email: 'ana@pawlife.com',
        password: 'hash-generado',
        phone: null,
        role,
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: { role: true },
      });
      expect(result).toBe(storedUser);
    });
  });

  describe('findAll', () => {
    it('consulta sin filtros cuando no se envía ninguno', async () => {
      await service.findAll();

      expect(usersRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: { role: true },
        order: { id: 'ASC' },
      });
    });

    it('aplica los filtros de nombre, correo y rol', async () => {
      await service.findAll({ name: 'ana', email: 'paw', roleId: 2 });

      const [options] = usersRepository.find.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(options.where).toHaveProperty('name');
      expect(options.where).toHaveProperty('email');
      expect(options.where.role).toEqual({ id: 2 });
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el usuario con su rol', async () => {
      usersRepository.findOne.mockResolvedValue(storedUser);

      await expect(service.findOne(10)).resolves.toBe(storedUser);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException cuando el usuario no existe', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Nueva' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ConflictException cuando el correo pertenece a otro usuario', async () => {
      usersRepository.findOne.mockResolvedValue({ ...storedUser });
      usersRepository.findOneBy.mockResolvedValue({ ...storedUser, id: 11 });

      await expect(
        service.update(10, { email: 'otra@pawlife.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('permite conservar el mismo correo del usuario', async () => {
      const user = { ...storedUser };
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.findOneBy.mockResolvedValue({ ...storedUser });
      usersRepository.save.mockResolvedValue(user);

      await expect(
        service.update(10, { email: 'ANA@pawlife.com' }),
      ).resolves.toBe(user);
      expect(user.email).toBe('ana@pawlife.com');
    });

    it('cifra la contraseña nueva y recorta el nombre', async () => {
      const user = { ...storedUser };
      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue(user);

      await service.update(10, { name: '  Ana María  ', password: 'nueva' });

      expect(hash).toHaveBeenCalledWith('nueva', 10);
      expect(user.name).toBe('Ana María');
      expect(user.password).toBe('hash-generado');
    });

    it('lanza NotFoundException cuando el rol nuevo no existe', async () => {
      usersRepository.findOne.mockResolvedValue({ ...storedUser });
      rolesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(10, { roleId: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException cuando no se elimina ninguna fila', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('elimina al usuario existente', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(10)).resolves.toBeUndefined();
      expect(usersRepository.delete).toHaveBeenCalledWith(10);
    });
  });
});
