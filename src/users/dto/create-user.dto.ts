import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'Ana Ruiz', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres.' })
  name: string;

  @ApiProperty({ example: 'ana@example.com', maxLength: 150 })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @MaxLength(150, { message: 'El correo no puede superar 150 caracteres.' })
  email: string;

  @ApiProperty({ minLength: 6, maxLength: 255 })
  @IsString({ message: 'La contraseña debe ser texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(255, { message: 'La contraseña no puede superar 255 caracteres.' })
  password: string;

  @ApiProperty({ required: false, maxLength: 20 })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto.' })
  @MaxLength(20, { message: 'El teléfono no puede superar 20 caracteres.' })
  phone?: string | null;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El ID del rol debe ser un número entero.' })
  @Min(1, { message: 'El ID del rol debe ser mayor que cero.' })
  roleId: number;
}