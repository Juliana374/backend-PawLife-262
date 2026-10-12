import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from '@nestjs/class-validator';

export class FindVeterinariansQueryDto {
  @ApiPropertyOptional({ example: 'cirugía' })
  @IsOptional()
  @IsString({ message: 'La especialidad de búsqueda debe ser texto.' })
  specialty?: string;

  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @IsString({ message: 'El nombre de búsqueda debe ser texto.' })
  name?: string;
}