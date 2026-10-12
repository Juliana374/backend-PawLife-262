import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';


export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput){
    const email = input.email.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
      where: { email },
      relations: {
        role: {
          rolePermissions: { permission: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.createAuthResponse(user);
  }

  private createAuthResponse(user: User) {
    const { password: _password, role, ...safeUser } = user;

    const permissions = role?.rolePermissions?.map((rp) => rp.permission) ?? [];

    const userWithPermissions = {
      ...safeUser,
      role: {
        id: role.id,
        name: role.name,
        permissions,
      },
    };

    const payload = {
      sub: user.id,
      email: user.email,
      role: role?.name,
      permissions: permissions.map((p) => p.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithPermissions,
    };
  }
}
