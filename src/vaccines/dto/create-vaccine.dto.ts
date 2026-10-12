import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class CreateVaccineDto {
  @ApiProperty({ maxLength: 100 })
  @IsString({ message: 'El nombre de la vacuna debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la vacuna es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  name: string;

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
  @IsDateString({}, { message: 'La fecha de aplicación no es válida.' })
  applicationDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de próxima dosis no es válida.' })
  nextDoseDate?: string | null;
}