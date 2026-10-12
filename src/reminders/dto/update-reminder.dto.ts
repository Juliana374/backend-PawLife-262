import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from '@nestjs/class-validator';
import { CreateReminderDto } from './create-reminder.dto';

export class UpdateReminderDto extends PartialType(CreateReminderDto) {
	@ApiPropertyOptional({ description: 'Indica si el recordatorio fue completado.' })
	@IsOptional()
	@IsBoolean({ message: 'completed debe ser verdadero o falso.' })
	completed?: boolean;
}