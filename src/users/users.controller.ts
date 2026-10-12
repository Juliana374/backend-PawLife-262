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
  ApiBadRequestResponse,
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
import { AppPermission } from '../auth/enums/app-permission.enum';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({
  description: 'El usuario no tiene el permiso requerido.',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(AppPermission.CREATE_USER)
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'Usuario creado.',
    schema: { example: { status: 'ok', data: { id: 1, name: 'Ana Ruiz' } } },
  })
  @ApiBadRequestResponse({ description: 'Los datos enviados no son válidos.' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado.' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese correo.' })
  async create(@Body() input: CreateUserDto) {
    return this.success(await this.usersService.create(input));
  }

  @Get()
  @RequirePermissions(AppPermission.READ_USER)
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiOkResponse({
    description: 'Lista de usuarios.',
    schema: { example: { status: 'ok', data: [{ id: 1, name: 'Ana Ruiz' }] } },
  })
  async findAll(@Query() filters: FindUsersQueryDto) {
    return this.success(await this.usersService.findAll(filters));
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_USER)
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiOkResponse({
    description: 'Usuario encontrado.',
    schema: { example: { status: 'ok', data: { id: 1, name: 'Ana Ruiz' } } },
  })
  @ApiBadRequestResponse({ description: 'El ID debe ser un número entero.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.usersService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_USER)
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'Usuario actualizado.',
    schema: { example: { status: 'ok', data: { id: 1, name: 'Ana Ruiz' } } },
  })
  @ApiBadRequestResponse({
    description: 'El ID o los datos enviados no son válidos.',
  })
  @ApiNotFoundResponse({ description: 'Usuario o rol no encontrado.' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese correo.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateUserDto,
  ) {
    return this.success(await this.usersService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiOkResponse({
    description: 'Usuario eliminado.',
    schema: { example: { status: 'ok', data: null } },
  })
  @ApiBadRequestResponse({ description: 'El ID debe ser un número entero.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return this.success(null);
  }

  private success(data: User | User[] | null) {
    const safeData = Array.isArray(data)
      ? data.map((user) => this.withoutPassword(user))
      : data
        ? this.withoutPassword(data)
        : null;

    return { status: 'ok', data: safeData };
  }

  private withoutPassword({ password: _password, ...user }: User) {
    return user;
  }
}
