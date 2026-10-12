import {
  Body,
  Controller,
  Get,
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
  ApiConflictResponse,
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
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { FindVeterinariansQueryDto } from './dto/find-veterinarians-query.dto';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansService } from './veterinarians.service';

@ApiTags('Veterinarios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('veterinarians')
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  @Post()
  @RequirePermissions(AppPermission.CREATE_VETERINARIAN)
  @ApiOperation({ summary: 'Crear perfil veterinario' })
  @ApiBody({ type: CreateVeterinarianDto })
  @ApiCreatedResponse({ description: 'Perfil veterinario creado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @ApiConflictResponse({ description: 'El perfil o número de licencia ya existe.' })
  async create(@Body() input: CreateVeterinarianDto) {
    return this.success(await this.veterinariansService.create(input));
  }

  @Get()
  @RequirePermissions(AppPermission.READ_VETERINARIAN)
  @ApiOperation({ summary: 'Listar perfiles veterinarios' })
  @ApiOkResponse({ description: 'Lista de veterinarios.' })
  async findAll(@Query() filters: FindVeterinariansQueryDto) {
    return this.success(await this.veterinariansService.findAll(filters));
  }

  @Get(':userId')
  @RequirePermissions(AppPermission.READ_VETERINARIAN)
  @ApiOperation({ summary: 'Obtener perfil veterinario por ID de usuario' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiOkResponse({ description: 'Perfil veterinario encontrado.' })
  @ApiNotFoundResponse({ description: 'Veterinario no encontrado.' })
  async findOne(@Param('userId', ParseIntPipe) userId: number) {
    return this.success(await this.veterinariansService.findOne(userId));
  }

  @Patch(':userId')
  @RequirePermissions(AppPermission.UPDATE_VETERINARIAN)
  @ApiOperation({ summary: 'Actualizar perfil veterinario' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiBody({ type: UpdateVeterinarianDto })
  @ApiOkResponse({ description: 'Perfil veterinario actualizado.' })
  @ApiNotFoundResponse({ description: 'Veterinario no encontrado.' })
  @ApiConflictResponse({ description: 'El número de licencia ya está registrado.' })
  async update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() input: UpdateVeterinarianDto,
  ) {
    return this.success(await this.veterinariansService.update(userId, input));
  }

  private success(data: Veterinarian | Veterinarian[]) {
    const safeData = Array.isArray(data)
      ? data.map((veterinarian) => this.withoutPassword(veterinarian))
      : this.withoutPassword(data);
    return { status: 'ok', data: safeData };
  }

  private withoutPassword(veterinarian: Veterinarian) {
    const { password: _password, ...user } = veterinarian.user;
    return { ...veterinarian, user };
  }
}