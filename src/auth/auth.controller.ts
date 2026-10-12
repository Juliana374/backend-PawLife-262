import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso. Retorna el token y el usuario con su rol y permisos.',
    schema: {
      example: {
        status: 'ok',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid-1234',
            name: 'Juan Perez',
            email: 'usuario@example.com',
            role: {
              id: 1,
              name: 'ADMIN',
              permissions: [
                { id: 1, name: 'CREATE_USER', description: 'Crear usuarios' },
                { id: 2, name: 'DELETE_USER', description: 'Eliminar usuarios' },
              ],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas.',
  })
  async login(@Body() input: LoginDto) {
    const { access_token, user } = await this.authService.login(input);

    return {
      status: 'ok',
      data: {
        access_token,
        user,
      },
    };
  }
}