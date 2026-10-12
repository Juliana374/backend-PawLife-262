import { PartialType } from '@nestjs/swagger';
import { CreateVeterinarianDto } from './create-veterinarian.dto';

export class UpdateVeterinarianDto extends PartialType(CreateVeterinarianDto) {}