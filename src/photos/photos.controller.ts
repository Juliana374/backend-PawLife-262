import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { ensureUploadDirectory } from '../common/upload-directory';
import { Photo } from '../pets/entities/photo.entity';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { FindPhotosQueryDto } from './dto/find-photos-query.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { PhotosService, UploadedPhoto } from './photos.service';

interface UploadFile {
  mimetype: string;
  filename: string;
  originalname: string;
}

type UploadCallback = (error: Error | null, value: string) => void;

const { diskStorage } = require('multer');

const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const UploadPhoto = FileInterceptor('photo', {
  storage: diskStorage({
    destination: (_request: unknown, _file: unknown, callback: UploadCallback) => {
      try {
        callback(null, ensureUploadDirectory());
      } catch (error) {
        callback(error as Error, '');
      }
    },
    filename: (_request: unknown, file: Pick<UploadFile, 'mimetype'>, callback: UploadCallback) => {
      callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  fileFilter: (
    _request: unknown,
    file: Pick<UploadFile, 'mimetype'>,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!imageExtensions[file.mimetype]) {
      return callback(new BadRequestException('Solo se permiten imágenes'), false);
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@ApiTags('Fotos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
@ApiForbiddenResponse({ description: 'Falta el permiso requerido.' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @RequirePermissions(AppPermission.CREATE_PHOTO)
  @ApiOperation({ summary: 'Subir una foto para una mascota' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['petId', 'photo'],
      properties: {
        petId: { type: 'integer' },
        description: { type: 'string', maxLength: 255, nullable: true },
        takenAt: { type: 'string', format: 'date-time' },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Foto creada.' })
  @ApiBadRequestResponse({ description: 'Los datos o el archivo no son válidos.' })
  @ApiNotFoundResponse({ description: 'Mascota no encontrada.' })
  @UseInterceptors(UploadPhoto)
  async create(
    @Body() input: CreatePhotoDto,
    @UploadedFile() file?: UploadFile,
  ) {
    if (!file) throw new BadRequestException('Debes adjuntar una foto.');
    return this.success(
      await this.photosService.create(input, {
        filename: file.filename,
        originalName: file.originalname.slice(0, 255),
      }),
    );
  }

  @Get()
  @RequirePermissions(AppPermission.READ_PHOTO)
  @ApiOperation({ summary: 'Listar fotos, opcionalmente filtradas por mascota' })
  @ApiOkResponse({ description: 'Lista de fotos.' })
  async findAll(@Query() filters: FindPhotosQueryDto) {
    return this.success(await this.photosService.findAll(filters));
  }

  @Get(':id')
  @RequirePermissions(AppPermission.READ_PHOTO)
  @ApiOperation({ summary: 'Obtener una foto por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Foto encontrada.' })
  @ApiBadRequestResponse({ description: 'El ID debe ser un número entero.' })
  @ApiNotFoundResponse({ description: 'Foto no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.success(await this.photosService.findOne(id));
  }

  @Patch(':id')
  @RequirePermissions(AppPermission.UPDATE_PHOTO)
  @ApiOperation({ summary: 'Actualizar los metadatos de una foto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Foto actualizada.' })
  @ApiBadRequestResponse({ description: 'El ID o los datos no son válidos.' })
  @ApiNotFoundResponse({ description: 'Foto no encontrada.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdatePhotoDto,
  ) {
    return this.success(await this.photosService.update(id, input));
  }

  @Delete(':id')
  @RequirePermissions(AppPermission.DELETE_PHOTO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una foto y su archivo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ schema: { example: { status: 'ok', data: null } } })
  @ApiBadRequestResponse({ description: 'El ID debe ser un número entero.' })
  @ApiNotFoundResponse({ description: 'Foto no encontrada.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.photosService.remove(id);
    return this.success(null);
  }

  private success(data: Photo | Photo[] | null) {
    const serialize = (photo: Photo) => {
      const { filename, ...photoData } = photo;
      return {
        ...photoData,
        url: `/uploads/${encodeURIComponent(basename(filename))}`,
      };
    };
    const safeData = Array.isArray(data)
      ? data.map(serialize)
      : data
        ? serialize(data)
        : null;

    return { status: 'ok', data: safeData };
  }
}