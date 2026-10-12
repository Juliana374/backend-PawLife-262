import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Vaccine } from './entities/vaccine.entity';
import { VaccinesController } from './vaccines.controller';
import { VaccinesService } from './vaccines.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Vaccine])],
  controllers: [VaccinesController],
  providers: [VaccinesService],
})
export class VaccinesModule {}