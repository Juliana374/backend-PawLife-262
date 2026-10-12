import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from '@nestjs/class-validator';

export class CreateMedicationDto {
  @ApiProperty({ maxLength: 100 })
  @IsString({ message: 'El nombre del medicamento debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  name: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  activeIngredient?: string | null;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  concentration?: string | null;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  presentation?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}