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
import { withoutVetPassword } from '../common/sanitize-user';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';

@ApiTags('Citas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @RequirePermissions(AppPermission.CREATE_APPOINTMENT)
  @ApiOperation({ summary: 'Crear una cita' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiCreatedResponse({ description: 'Cita creada.' })
  async create(@Body() input: CreateAppointmentDto) {
    return this.success(await this.appointmentsService.create(input));
  }

  @Get()
  @RequirePermissions(AppPermission.READ_APPOINTMENT)
  @ApiOperation({ summary: 'Listar citas' })
  @ApiOkResponse({ description: 'Lista de citas.' })
  async findAll(@Query() filters: FindAppointmentsQueryDto) {
    return this.success(await this.appointmentsService.findAll(filters));
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_APPOINTMENT)
  @ApiOperation({ summary: 'Obtener una cita' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Cita encontrada.' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.appointmentsService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_APPOINTMENT)
  @ApiOperation({ summary: 'Actualizar una cita' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiOkResponse({ description: 'Cita actualizada.' })
  @ApiNotFoundResponse({ description: 'Cita, mascota o veterinario no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateAppointmentDto,
  ) {
    return this.success(await this.appointmentsService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_APPOINTMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una cita' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.appointmentsService.remove(id);
    return this.success(null);
  }

  private success(data: Appointment | Appointment[] | null) {
    const safeData = Array.isArray(data)
      ? data.map((appointment) => withoutVetPassword(appointment))
      : data
        ? withoutVetPassword(data)
        : null;
    return { status: 'ok', data: safeData };
  }

}