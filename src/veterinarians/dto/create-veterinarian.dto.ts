import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class CreateVeterinarianDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID del usuario debe ser un número entero.' })
  @Min(1, { message: 'El ID del usuario debe ser mayor que cero.' })
  userId: number;

  @ApiProperty({ maxLength: 50 })
  @IsString({ message: 'El número de licencia debe ser texto.' })
  @IsNotEmpty({ message: 'El número de licencia es obligatorio.' })
  @MaxLength(50, { message: 'La licencia no puede superar 50 caracteres.' })
  licenseNumber: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'La especialidad debe ser texto.' })
  @MaxLength(100, { message: 'La especialidad no puede superar 100 caracteres.' })
  specialty?: string | null;
}