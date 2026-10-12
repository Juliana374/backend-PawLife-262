import { PartialType } from '@nestjs/swagger';
import { CreatePetMedicationDto } from './create-medication.dto';

export class UpdatePetMedicationDto extends PartialType(CreatePetMedicationDto) {}
