import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Veterinarian } from './entities/veterinarian.entity';
import { VeterinariansController } from './veterinarians.controller';
import { VeterinariansService } from './veterinarians.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Veterinarian])],
  controllers: [VeterinariansController],
  providers: [VeterinariansService],
})
export class VeterinariansModule {}