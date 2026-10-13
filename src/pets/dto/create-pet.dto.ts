import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from '@nestjs/class-validator';
import { Transform, Type } from 'class-transformer';
import { PetSex, PetSpecies } from '../entities/pet.entity';

export class CreatePetDto {
  @ApiProperty({ maxLength: 80 })
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la mascota es obligatorio.' })
  @MaxLength(80, { message: 'El nombre no puede superar 80 caracteres.' })
  name: string;

  @ApiProperty({ enum: PetSpecies })
  @IsEnum(PetSpecies, { message: 'La especie seleccionada no es válida.' })
  species: PetSpecies;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'La raza debe ser texto.' })
  @MaxLength(80, { message: 'La raza no puede superar 80 caracteres.' })
  breed?: string | null;

  @ApiPropertyOptional({ enum: PetSex, nullable: true })
  @IsOptional()
  @IsEnum(PetSex, { message: 'El sexo seleccionado no es válido.' })
  sex?: PetSex | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida.' })
  birthDate?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso.' })
  active?: boolean;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID del propietario debe ser un número entero.' })
  @Min(1, { message: 'El ID del propietario debe ser mayor que cero.' })
  ownerId: number;
}