import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateWeightRecordDto } from './dto/create-weight-record.dto';
import { FindWeightRecordsQueryDto } from './dto/find-weight-records-query.dto';
import { WeightRecord } from './entities/weight-record.entity';
import { WeightRecordsService } from './weight-records.service';

@ApiTags('Registros de peso')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('weight-records')
export class WeightRecordsController {
  constructor(private readonly weightRecordsService: WeightRecordsService) {}

  @Get()
  @RequirePermissions(AppPermission.READ_WEIGHT_RECORD)
  @ApiOperation({ summary: 'Listar registros de peso con filtros opcionales' })
  @ApiOkResponse({ description: 'Lista de registros filtrada.' })
  async findAll(@Query() filters: FindWeightRecordsQueryDto) {
    return this.success(await this.weightRecordsService.findAll(filters));
  }

  @Post()
  @RequirePermissions(AppPermission.CREATE_WEIGHT_RECORD)
  @ApiOperation({ summary: 'Registrar el peso de una mascota' })
  @ApiBody({ type: CreateWeightRecordDto })
  @ApiCreatedResponse({ description: 'Peso registrado.' })
  async create(@Body() input: CreateWeightRecordDto) {
    return this.success(await this.weightRecordsService.create(input));
  }

  @Get('pet/:petId')
  @RequirePermissions(AppPermission.READ_WEIGHT_RECORD)
  @ApiOperation({ summary: 'Listar pesos de una mascota' })
  @ApiParam({ name: 'petId', type: Number })
  @ApiOkResponse({ description: 'Lista de registros de peso.' })
  async findByPet(
    @Param('petId', ParseIntPipe) petId: number,
    @Query() filters: FindWeightRecordsQueryDto,
  ) {
    return this.success(
      await this.weightRecordsService.findAll({ ...filters, petId }),
    );
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_WEIGHT_RECORD)
  @ApiOperation({ summary: 'Obtener un registro de peso' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Registro encontrado.' })
  @ApiNotFoundResponse({ description: 'Registro de peso no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.weightRecordsService.findOne(id));
  }

  private success(data: WeightRecord | WeightRecord[]) {
    const safeData = Array.isArray(data)
      ? data.map((record) => withoutAppointmentVetPassword(record))
      : data
        ? withoutAppointmentVetPassword(data)
        : null;
    return { status: 'ok', data: safeData };
  }
}