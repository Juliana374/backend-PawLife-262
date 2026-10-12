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
import { ReminderType } from '../entities/reminder.entity';

export class CreateReminderDto {
  @ApiProperty({ maxLength: 120 })
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(120, { message: 'El título no puede superar 120 caracteres.' })
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  description?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString({}, { message: 'La fecha del recordatorio no es válida.' })
  remindAt: string;

  @ApiPropertyOptional({ enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType, { message: 'El tipo de recordatorio no es válido.' })
  type?: ReminderType;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID del usuario creador debe ser un número entero.' })
  @Min(1, { message: 'El ID del usuario creador debe ser mayor que cero.' })
  createdByUserId: number;
}