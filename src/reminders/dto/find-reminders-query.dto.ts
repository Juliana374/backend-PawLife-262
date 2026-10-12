import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from '@nestjs/class-validator';
import { Transform, Type } from 'class-transformer';
import { ReminderType } from '../entities/reminder.entity';

export class FindRemindersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID del usuario creador debe ser un número entero.' })
  @Min(1, { message: 'El ID del usuario creador debe ser mayor que cero.' })
  createdByUserId?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean({ message: 'completed debe ser true o false.' })
  completed?: boolean;

  @ApiPropertyOptional({ enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType, { message: 'El tipo de recordatorio no es válido.' })
  type?: ReminderType;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial no es válida.' })
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha final no es válida.' })
  to?: string;
}