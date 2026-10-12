import { User } from '../users/entities/user.entity';
import {
  withoutAppointmentVetPassword,
  withoutPassword,
  withoutVetPassword,
} from './sanitize-user';

const user = {
  id: 2,
  name: 'Ana Gómez',
  email: 'ana@pawlife.com',
  password: 'hash-guardado',
} as unknown as User;

describe('withoutPassword', () => {
  it('quita la contraseña y conserva el resto', () => {
    expect(withoutPassword(user)).toEqual({
      id: 2,
      name: 'Ana Gómez',
      email: 'ana@pawlife.com',
    });
  });

  it('no modifica el objeto original', () => {
    withoutPassword(user);

    expect(user.password).toBe('hash-guardado');
  });
});

describe('withoutVetPassword', () => {
  it('limpia la contraseña del usuario del veterinario', () => {
    const appointment = { id: 5, vet: { userId: 2, user } };

    const result = withoutVetPassword(appointment);

    expect(result.vet.user).not.toHaveProperty('password');
    expect(result.vet.userId).toBe(2);
    expect(result.id).toBe(5);
  });

  it('devuelve la cita tal cual cuando el veterinario no trae usuario', () => {
    const appointment = { id: 5, vet: { userId: 2 } };

    expect(withoutVetPassword(appointment)).toBe(appointment);
  });

  it('devuelve la cita tal cual cuando no hay veterinario cargado', () => {
    const appointment = { id: 5 };

    expect(withoutVetPassword(appointment)).toBe(appointment);
  });
});

describe('withoutAppointmentVetPassword', () => {
  it('limpia la contraseña del veterinario dentro de la cita', () => {
    const vaccine = {
      id: 3,
      name: 'Rabia',
      appointment: { id: 5, vet: { userId: 2, user } },
    };

    const result = withoutAppointmentVetPassword(vaccine);

    expect(JSON.stringify(result)).not.toMatch(/"password"/);
    expect(result.appointment.vet.userId).toBe(2);
    expect(result.name).toBe('Rabia');
  });

  it('devuelve el registro tal cual cuando no tiene cita asociada', () => {
    const vaccine = { id: 3, appointment: null };

    expect(withoutAppointmentVetPassword(vaccine)).toBe(vaccine);
  });
});
