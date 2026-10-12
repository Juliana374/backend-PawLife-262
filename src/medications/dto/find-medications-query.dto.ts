import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';
import { MedicationStatus } from '../entities/medication.entity';

export class FindMedicationsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la cita debe ser un número entero.' })
  @Min(1, { message: 'El ID de la cita debe ser mayor que cero.' })
  appointmentId?: number;

  @ApiPropertyOptional({ enum: MedicationStatus })
  @IsOptional()
  @IsEnum(MedicationStatus, { message: 'El estado del medicamento no es válido.' })
  status?: MedicationStatus;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial no es válida.' })
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha final no es válida.' })
  to?: string;
}