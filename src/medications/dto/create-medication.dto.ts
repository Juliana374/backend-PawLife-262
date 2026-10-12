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
import { MedicationStatus } from '../entities/medication.entity';

export class CreateMedicationDto {
  @ApiProperty({ maxLength: 100 })
  @IsString({ message: 'El nombre del medicamento debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  name: string;

  @ApiProperty({ maxLength: 50 })
  @IsString({ message: 'La dosis debe ser texto.' })
  @IsNotEmpty({ message: 'La dosis es obligatoria.' })
  @MaxLength(50, { message: 'La dosis no puede superar 50 caracteres.' })
  dose: string;

  @ApiProperty({ maxLength: 50 })
  @IsString({ message: 'El horario debe ser texto.' })
  @IsNotEmpty({ message: 'El horario es obligatorio.' })
  @MaxLength(50, { message: 'El horario no puede superar 50 caracteres.' })
  schedule: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la cita debe ser un número entero.' })
  @Min(1, { message: 'El ID de la cita debe ser mayor que cero.' })
  appointmentId?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio no es válida.' })
  startDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de finalización no es válida.' })
  endDate?: string | null;

  @ApiPropertyOptional({ enum: MedicationStatus })
  @IsOptional()
  @IsEnum(MedicationStatus, { message: 'El estado del medicamento no es válido.' })
  status?: MedicationStatus;
}