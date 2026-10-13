import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from '@nestjs/class-validator';
import { Type } from 'class-transformer';

export class FindPhotosQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de la mascota debe ser un número entero.' })
  @Min(1, { message: 'El ID de la mascota debe ser mayor que cero.' })
  petId?: number;
}