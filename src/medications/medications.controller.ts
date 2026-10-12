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
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { FindMedicationsQueryDto } from './dto/find-medications-query.dto';
import { Medication } from './entities/medication.entity';
import { MedicationsService } from './medications.service';

@ApiTags('Medicamentos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  @RequirePermissions(AppPermission.READ_MEDICATION)
  @ApiOperation({ summary: 'Listar medicamentos con filtros opcionales' })
  @ApiOkResponse({ description: 'Lista de medicamentos filtrada.' })
  async findAll(@Query() filters: FindMedicationsQueryDto) {
    return this.success(await this.medicationsService.findAll(filters));
  }

  @Post()
  @RequirePermissions(AppPermission.CREATE_MEDICATION)
  @ApiOperation({ summary: 'Registrar un medicamento' })
  @ApiBody({ type: CreateMedicationDto })
  @ApiCreatedResponse({ description: 'Medicamento registrado.' })
  async create(@Body() input: CreateMedicationDto) {
    return this.success(await this.medicationsService.create(input));
  }

  @Get('pet/:petId')
  @RequirePermissions(AppPermission.READ_MEDICATION)
  @ApiOperation({ summary: 'Listar medicamentos de una mascota' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiOkResponse({ description: 'Lista de medicamentos.' })
  async findByPet(
    @Param('petId', ParseIntPipe) petId: number,
    @Query() filters: FindMedicationsQueryDto,
  ) {
    return this.success(
      await this.medicationsService.findAll({ ...filters, petId }),
    );
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_MEDICATION)
  @ApiOperation({ summary: 'Obtener un medicamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Medicamento encontrado.' })
  @ApiNotFoundResponse({ description: 'Medicamento no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.medicationsService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_MEDICATION)
  @ApiOperation({ summary: 'Actualizar un medicamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMedicationDto })
  @ApiOkResponse({ description: 'Medicamento actualizado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateMedicationDto,
  ) {
    return this.success(await this.medicationsService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_MEDICATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un medicamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.medicationsService.remove(id);
    return this.success(null);
  }

  private success(data: Medication | Medication[] | null) {
    const safeData = Array.isArray(data)
      ? data.map((medication) => withoutAppointmentVetPassword(medication))
      : data
        ? withoutAppointmentVetPassword(data)
        : null;
    return { status: 'ok', data: safeData };
  }
}