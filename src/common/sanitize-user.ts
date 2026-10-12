import { User } from '../users/entities/user.entity';

export type SafeUser = Omit<User, 'password'>;

/** Devuelve el usuario sin el hash de la contraseña. */
export function withoutPassword(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

/**
 * Limpia la contraseña del usuario del veterinario asociado a una cita.
 * Si la relación no viene cargada, devuelve la cita tal cual.
 */
export function withoutVetPassword<T extends object>(appointment: T): T {
  const { vet } = appointment as { vet?: { user?: User | null } | null };
  const user = vet?.user;
  if (!user) return appointment;
  return {
    ...appointment,
    vet: { ...vet, user: withoutPassword(user) },
  } as T;
}

/**
 * Limpia la contraseña del veterinario que viaja dentro de la cita de un
 * registro clínico (vacuna, medicamento, registro de peso). Es defensiva a
 * propósito: hoy esos servicios no cargan `appointment.vet.user`, pero si
 * alguien agrega esa relación la respuesta no debe filtrar el hash.
 */
export function withoutAppointmentVetPassword<T extends object>(record: T): T {
  const { appointment } = record as { appointment?: object | null };
  if (!appointment) return record;
  return {
    ...record,
    appointment: withoutVetPassword(appointment),
  } as T;
}
