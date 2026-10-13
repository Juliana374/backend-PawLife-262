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
import { CreatePetMedicationDto } from './dto/create-medication.dto';
import { UpdatePetMedicationDto } from './dto/update-medication.dto';
import { FindPetMedicationsQueryDto } from './dto/find-medications-query.dto';
import { PetMedication } from './entities/medication.entity';
import { PetMedicationsService } from './medications.service';

@ApiTags('Medicamentos de mascotas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pet-medications')
export class PetMedicationsController {
  constructor(private readonly medicationsService: PetMedicationsService) {}

  @Get()
  @RequirePermissions(AppPermission.READ_PET_MEDICATION)
  @ApiOperation({ summary: 'Listar medicamentos con filtros opcionales' })
  @ApiOkResponse({ description: 'Lista de medicamentos filtrada.' })
  async findAll(@Query() filters: FindPetMedicationsQueryDto) {
    return this.success(await this.medicationsService.findAll(filters));
  }

  @Post()
  @RequirePermissions(AppPermission.CREATE_PET_MEDICATION)
  @ApiOperation({ summary: 'Registrar un medicamento' })
  @ApiBody({ type: CreatePetMedicationDto })
  @ApiCreatedResponse({ description: 'Medicamento registrado.' })
  async create(@Body() input: CreatePetMedicationDto) {
    return this.success(await this.medicationsService.create(input));
  }

  @Get('pet/:petId')
  @RequirePermissions(AppPermission.READ_PET_MEDICATION)
  @ApiOperation({ summary: 'Listar medicamentos de una mascota' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiOkResponse({ description: 'Lista de medicamentos.' })
  async findByPet(
    @Param('petId', ParseIntPipe) petId: number,
    @Query() filters: FindPetMedicationsQueryDto,
  ) {
    return this.success(
      await this.medicationsService.findAll({ ...filters, petId }),
    );
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_PET_MEDICATION)
  @ApiOperation({ summary: 'Obtener un medicamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Medicamento encontrado.' })
  @ApiNotFoundResponse({ description: 'Medicamento no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.medicationsService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_PET_MEDICATION)
  @ApiOperation({ summary: 'Actualizar un medicamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePetMedicationDto })
  @ApiOkResponse({ description: 'Medicamento actualizado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdatePetMedicationDto,
  ) {
    return this.success(await this.medicationsService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_PET_MEDICATION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un medicamento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.medicationsService.remove(id);
    return this.success(null);
  }

  private success(data: PetMedication | PetMedication[] | null) {
    return { status: 'ok', data };
  }
}
