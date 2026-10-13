import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class CreatePhotoDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId: number;

  @ApiPropertyOptional({ example: 'Control dermatológico', maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  @MaxLength(255, { message: 'La descripción no puede superar 255 caracteres.' })
  description?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de captura no es válida.' })
  takenAt?: string;
}