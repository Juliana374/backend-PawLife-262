import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from '@nestjs/class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({
    description: 'Contraseña de la cuenta',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}