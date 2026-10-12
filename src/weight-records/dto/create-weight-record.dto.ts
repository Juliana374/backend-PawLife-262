import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class CreateWeightRecordDto {
  @ApiProperty({ example: 12.5, minimum: 0 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El peso debe ser un número.' })
  @IsPositive({ message: 'El peso debe ser mayor que cero.' })
  weightKg: number;

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
  @IsDateString({}, { message: 'La fecha de medición no es válida.' })
  measurementDate?: string;
}