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
import { withoutAppointmentVetPassword } from '../common/sanitize-user';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';
import { FindVaccinesQueryDto } from './dto/find-vaccines-query.dto';
import { Vaccine } from './entities/vaccine.entity';
import { VaccinesService } from './vaccines.service';

@ApiTags('Vacunas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vaccines')
export class VaccinesController {
  constructor(private readonly vaccinesService: VaccinesService) {}

  @Get()
  @RequirePermissions(AppPermission.READ_VACCINE)
  @ApiOperation({ summary: 'Listar vacunas con filtros opcionales' })
  @ApiOkResponse({ description: 'Lista de vacunas filtrada.' })
  async findAll(@Query() filters: FindVaccinesQueryDto) {
    return this.success(await this.vaccinesService.findAll(filters));
  }

  @Post()
  @RequirePermissions(AppPermission.CREATE_VACCINE)
  @ApiOperation({ summary: 'Registrar una vacuna' })
  @ApiBody({ type: CreateVaccineDto })
  @ApiCreatedResponse({ description: 'Vacuna registrada.' })
  async create(@Body() input: CreateVaccineDto) {
    return this.success(await this.vaccinesService.create(input));
  }

  @Get('pet/:petId')
  @RequirePermissions(AppPermission.READ_VACCINE)
  @ApiOperation({ summary: 'Listar vacunas de una mascota' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiOkResponse({ description: 'Lista de vacunas.' })
  async findByPet(
    @Param('petId', ParseIntPipe) petId: number,
    @Query() filters: FindVaccinesQueryDto,
  ) {
    return this.success(
      await this.vaccinesService.findAll({ ...filters, petId }),
    );
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_VACCINE)
  @ApiOperation({ summary: 'Obtener una vacuna' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Vacuna encontrada.' })
  @ApiNotFoundResponse({ description: 'Vacuna no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.vaccinesService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_VACCINE)
  @ApiOperation({ summary: 'Actualizar una vacuna' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateVaccineDto })
  @ApiOkResponse({ description: 'Vacuna actualizada.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateVaccineDto,
  ) {
    return this.success(await this.vaccinesService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_VACCINE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una vacuna' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vaccinesService.remove(id);
    return this.success(null);
  }

  private success(data: Vaccine | Vaccine[] | null) {
    const safeData = Array.isArray(data)
      ? data.map((vaccine) => withoutAppointmentVetPassword(vaccine))
      : data
        ? withoutAppointmentVetPassword(data)
        : null;
    return { status: 'ok', data: safeData };
  }
}