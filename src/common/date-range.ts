import { Between, FindOperator, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export function dateRange<T>(from?: T, to?: T): FindOperator<T> | undefined {
  if (from !== undefined && to !== undefined) return Between(from, to);
  if (from !== undefined) return MoreThanOrEqual(from);
  if (to !== undefined) return LessThanOrEqual(to);
  return undefined;
}