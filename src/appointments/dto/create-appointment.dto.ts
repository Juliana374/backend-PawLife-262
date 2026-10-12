import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId: number;

  @ApiProperty({ example: 1, description: 'ID de usuario del veterinario' })
  @Type(() => Number)
  @IsInt({ message: 'El ID del veterinario debe ser un número entero.' })
  @Min(1, { message: 'El ID del veterinario debe ser mayor que cero.' })
  vetId: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString({}, { message: 'La fecha de la cita no es válida.' })
  appointmentDate: string;

  @ApiProperty({ maxLength: 150 })
  @IsString({ message: 'El motivo debe ser texto.' })
  @IsNotEmpty({ message: 'El motivo de la cita es obligatorio.' })
  @MaxLength(150, { message: 'El motivo no puede superar 150 caracteres.' })
  reason: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus, { message: 'El estado de la cita no es válido.' })
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'El diagnóstico debe ser texto.' })
  diagnosis?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Las instrucciones deben ser texto.' })
  instructions?: string | null;
}