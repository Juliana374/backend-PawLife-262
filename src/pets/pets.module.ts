import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Photo } from './entities/photo.entity';
import { Pet } from './entities/pet.entity';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Pet, Photo])],
  controllers: [PetsController],
  providers: [PetsService],
})
export class PetsModule {}