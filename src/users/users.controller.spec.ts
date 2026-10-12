import {
  createControllerUnderTest,
  expectNoPassword,
} from '../../test/utils/controller-testing';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const storedUser = {
    id: 1,
    name: 'Ana Gómez',
    email: 'ana@pawlife.com',
    password: 'hash-guardado',
    phone: null,
    role: { id: 2, name: 'owner' },
  } as unknown as User;

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(storedUser),
      findAll: jest.fn().mockResolvedValue([storedUser, storedUser]),
      findOne: jest.fn().mockResolvedValue(storedUser),
      update: jest.fn().mockResolvedValue(storedUser),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    controller = await createControllerUnderTest(
      UsersController,
      UsersService,
      service,
    );
  });

  it('quita la contraseña al crear', async () => {
    const input = {
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      password: 'secreta',
      roleId: 2,
    };

    const result = await controller.create(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(result.status).toBe('ok');
    expectNoPassword(result);
    expect(result.data).toEqual({
      id: 1,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
      phone: null,
      role: { id: 2, name: 'owner' },
    });
  });

  it('quita la contraseña de cada usuario del listado', async () => {
    const result = await controller.findAll({ name: 'ana' });

    expect(service.findAll).toHaveBeenCalledWith({ name: 'ana' });
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
    expectNoPassword(result);
  });

  it('quita la contraseña al consultar por ID', async () => {
    const result = await controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expectNoPassword(result);
  });

  it('quita la contraseña al actualizar', async () => {
    const result = await controller.update(1, { name: 'Ana María' });

    expect(service.update).toHaveBeenCalledWith(1, { name: 'Ana María' });
    expectNoPassword(result);
  });

  it('responde con data en null al eliminar', async () => {
    const result = await controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ status: 'ok', data: null });
  });
});
