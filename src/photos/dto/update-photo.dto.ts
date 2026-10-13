import { PartialType, PickType } from '@nestjs/swagger';
import { CreatePhotoDto } from './create-photo.dto';

export class UpdatePhotoDto extends PartialType(
	PickType(CreatePhotoDto, ['description', 'takenAt'] as const),
) {}