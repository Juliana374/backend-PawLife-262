import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AppPermission } from '../auth/enums/app-permission.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FindRemindersQueryDto } from './dto/find-reminders-query.dto';
import { Reminder } from './entities/reminder.entity';
import { RemindersService } from './reminders.service';

@ApiTags('Recordatorios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @RequirePermissions(AppPermission.CREATE_REMINDER)
  @ApiOperation({ summary: 'Crear un recordatorio' })
  @ApiBody({ type: CreateReminderDto })
  @ApiCreatedResponse({ description: 'Recordatorio creado.' })
  async create(@Body() input: CreateReminderDto) {
    return this.success(await this.remindersService.create(input));
  }

  @Get()
  @RequirePermissions(AppPermission.READ_REMINDER)
  @ApiOperation({ summary: 'Listar recordatorios' })
  @ApiOkResponse({ description: 'Lista de recordatorios.' })
  async findAll(@Query() filters: FindRemindersQueryDto) {
    return this.success(await this.remindersService.findAll(filters));
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_REMINDER)
  @ApiOperation({ summary: 'Obtener un recordatorio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Recordatorio encontrado.' })
  @ApiNotFoundResponse({ description: 'Recordatorio no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.remindersService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_REMINDER)
  @ApiOperation({ summary: 'Actualizar un recordatorio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateReminderDto })
  @ApiOkResponse({ description: 'Recordatorio actualizado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateReminderDto,
  ) {
    return this.success(await this.remindersService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_REMINDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un recordatorio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.remindersService.remove(id);
    return this.success(null);
  }

  private success(data: Reminder | Reminder[] | null) {
    const safeData = Array.isArray(data)
      ? data.map((reminder) => this.withoutUserPassword(reminder))
      : data
        ? this.withoutUserPassword(data)
        : null;
    return { status: 'ok', data: safeData };
  }

  private withoutUserPassword(reminder: Reminder) {
    if (!reminder.createdByUser) return reminder;
    const { password: _password, ...safeUser } = reminder.createdByUser;
    return { ...reminder, createdByUser: safeUser };
  }
}