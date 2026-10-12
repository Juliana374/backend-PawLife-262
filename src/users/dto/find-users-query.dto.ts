import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class FindUsersQueryDto {
  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @IsString({ message: 'El nombre de búsqueda debe ser texto.' })
  name?: string;

  @ApiPropertyOptional({ example: 'example.com' })
  @IsOptional()
  @IsString({ message: 'El correo de búsqueda debe ser texto.' })
  email?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID del rol debe ser un número entero.' })
  @Min(1, { message: 'El ID del rol debe ser mayor que cero.' })
  roleId?: number;
}