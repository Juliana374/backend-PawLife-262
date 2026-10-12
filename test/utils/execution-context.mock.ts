import { ExecutionContext } from '@nestjs/common';

/**
 * ExecutionContext simulado con lo mínimo que consultan los guards:
 * la petición HTTP y el handler del que se leen los metadatos.
 */
export function createExecutionContext(
  request: Record<string, unknown> = {},
  handler: () => void = () => undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
    getHandler: () => handler,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}
