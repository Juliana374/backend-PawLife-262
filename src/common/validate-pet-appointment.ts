import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Pet } from '../pets/entities/pet.entity';

export async function validatePetAppointment(
  manager: EntityManager,
  petId: number,
  appointmentId?: number | null,
) {
  const pet = await manager.getRepository(Pet).findOneBy({
    id: petId,
    active: true,
  });
  if (!pet) {
    throw new NotFoundException('Mascota no encontrada');
  }

  if (appointmentId == null) return;

  const appointment = await manager
    .getRepository(Appointment)
    .findOneBy({ id: appointmentId });
  if (!appointment) {
    throw new NotFoundException('Cita no encontrada');
  }
  if (appointment.petId !== petId) {
    throw new BadRequestException('La mascota no coincide con la cita indicada');
  }
}