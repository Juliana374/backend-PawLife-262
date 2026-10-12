import { Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../src/auth/guards/permissions.guard';

const allowAll = { canActivate: () => true };

/**
 * Crea un controlador aislado: el servicio va simulado y los guards se
 * reemplazan, porque aquí se prueba el envelope y el filtrado de datos
 * sensibles, no la autenticación (esa tiene sus propias pruebas).
 */
export async function createControllerUnderTest<T>(
  controller: Type<T>,
  serviceToken: Type<unknown>,
  serviceMock: unknown,
): Promise<T> {
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers: [{ provide: serviceToken, useValue: serviceMock }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(allowAll)
    .overrideGuard(PermissionsGuard)
    .useValue(allowAll)
    .compile();

  return moduleRef.get(controller);
}

/** Falla si queda cualquier `password` en cualquier nivel de la respuesta. */
export function expectNoPassword(payload: unknown): void {
  const serialized = JSON.stringify(payload ?? null);
  expect(serialized).not.toMatch(/"password"/);
}
