import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createDataSourceMock } from '../../test/utils/typeorm.mock';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';
import { validatePetAppointment } from './validate-pet-appointment';

describe('validatePetAppointment', () => {
  let context: ReturnType<typeof createDataSourceMock>;

  beforeEach(() => {
    context = createDataSourceMock();
  });

  it('lanza NotFoundException cuando la mascota no existe o está inactiva', async () => {
    context.repository(Pet).findOneBy.mockResolvedValue(null);

    await expect(validatePetAppointment(context.manager, 1, null)).rejects.toThrow(
      NotFoundException,
    );
    expect(context.repository(Pet).findOneBy).toHaveBeenCalledWith({
      id: 1,
      active: true,
    });
  });

  it('no consulta la cita cuando no se envía appointmentId', async () => {
    context.repository(Pet).findOneBy.mockResolvedValue({ id: 1 });

    await expect(validatePetAppointment(context.manager, 1)).resolves.toBeUndefined();
    expect(context.repository(Appointment).findOneBy).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException cuando la cita no existe', async () => {
    context.repository(Pet).findOneBy.mockResolvedValue({ id: 1 });
    context.repository(Appointment).findOneBy.mockResolvedValue(null);

    await expect(validatePetAppointment(context.manager, 1, 99)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lanza BadRequestException cuando la cita pertenece a otra mascota', async () => {
    context.repository(Pet).findOneBy.mockResolvedValue({ id: 1 });
    context.repository(Appointment).findOneBy.mockResolvedValue({ id: 5, petId: 2 });

    await expect(validatePetAppointment(context.manager, 1, 5)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('resuelve cuando la mascota y la cita coinciden', async () => {
    context.repository(Pet).findOneBy.mockResolvedValue({ id: 1 });
    context.repository(Appointment).findOneBy.mockResolvedValue({ id: 5, petId: 1 });

    await expect(validatePetAppointment(context.manager, 1, 5)).resolves.toBeUndefined();
  });
});
