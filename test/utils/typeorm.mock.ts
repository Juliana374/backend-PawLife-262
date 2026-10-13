import { DataSource, EntityManager } from 'typeorm';

/**
 * Repositorio de TypeORM simulado con los métodos que usan los servicios.
 * Los valores por defecto representan "no hay datos"; cada prueba los ajusta.
 */
/** QueryBuilder simulado: los métodos de encadenamiento se devuelven a sí mismos. */
export interface QueryBuilderMock {
  innerJoinAndSelect: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
  getOne: jest.Mock;
}

export function createQueryBuilderMock(): QueryBuilderMock {
  const builder = {
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  } as QueryBuilderMock;

  const chainable: (keyof QueryBuilderMock)[] = [
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'orderBy',
  ];
  chainable.forEach((method) => builder[method].mockReturnValue(builder));

  return builder;
}

export interface RepositoryMock {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  merge: jest.Mock;
  createQueryBuilder: jest.Mock;
  /** El QueryBuilder que devuelve createQueryBuilder, para hacer aserciones. */
  queryBuilder: QueryBuilderMock;
}

export function createRepositoryMock(): RepositoryMock {
  const queryBuilder = createQueryBuilderMock();

  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn((data: unknown) => data),
    save: jest.fn(async (entity: unknown) => entity),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn(async (entity: unknown) => entity),
    merge: jest.fn((target: object, data: object) => Object.assign(target, data)),
    createQueryBuilder: jest.fn(() => queryBuilder),
    queryBuilder,
  };
}

export interface DataSourceMockContext {
  dataSource: DataSource;
  manager: EntityManager;
  /** Devuelve (y memoriza) el repositorio simulado de una entidad. */
  repository: (entity: unknown) => RepositoryMock;
  transaction: jest.Mock;
}

/**
 * DataSource simulado: `getRepository`, `manager` y `transaction` comparten
 * los mismos repositorios, así que lo que se configura fuera de la
 * transacción también aplica dentro de ella.
 */
export function createDataSourceMock(): DataSourceMockContext {
  const repositories = new Map<unknown, RepositoryMock>();

  const repository = (entity: unknown): RepositoryMock => {
    const existing = repositories.get(entity);
    if (existing) return existing;
    const created = createRepositoryMock();
    repositories.set(entity, created);
    return created;
  };

  const getRepository = jest.fn((entity: unknown) => repository(entity));
  const manager = { getRepository } as unknown as EntityManager;

  const transaction = jest.fn((first: unknown, second?: unknown) => {
    const runInTransaction = (
      typeof first === 'function' ? first : second
    ) as (entityManager: EntityManager) => Promise<unknown>;
    return runInTransaction(manager);
  });

  const dataSource = {
    manager,
    getRepository,
    transaction,
  } as unknown as DataSource;

  return { dataSource, manager, repository, transaction };
}
