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
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { Medication } from './entities/medication.entity';
import { MedicationsService } from './medications.service';

@ApiTags('Medicamentos generales')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  @RequirePermissions(AppPermission.READ_MEDICATION)
  @ApiOperation({ summary: 'Listar el catálogo general de medicamentos' })
  @ApiOkResponse({ description: 'Catálogo de medicamentos.' })
  async findAll() {
    return this.success(await this.medicationsService.findAll());
  }

  @Post()
  @RequirePermissions(AppPermission.CREATE_MEDICATION)
  @ApiOperation({ summary: 'Registrar un medicamento general' })
  @ApiBody({ type: CreateMedicationDto })
  @ApiCreatedResponse({ description: 'Medicamento registrado.' })
  async create(@Body() input: CreateMedicationDto) {
    return this.success(await this.medicationsService.create(input));
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_MEDICATION)
  @ApiOperation({ summary: 'Obtener un medicamento general' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Medicamento encontrado.' })
  @ApiNotFoundResponse({ description: 'Medicamento no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.medicationsService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_MEDICATION)
  @ApiOperation({ summary: 'Actualizar un medicamento general' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMedicationDto })
  @ApiOkResponse({ description: 'Medicamento actualizado.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateMedicationDto) {
    return this.success(await this.medicationsService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_MEDICATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un medicamento general' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.medicationsService.remove(id);
    return this.success(null);
  }

  private success(data: Medication | Medication[] | null) {
    return { status: 'ok', data };
  }
}