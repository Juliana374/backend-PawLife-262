import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WeightRecord } from './entities/weight-record.entity';
import { WeightRecordsController } from './weight-records.controller';
import { WeightRecordsService } from './weight-records.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([WeightRecord])],
  controllers: [WeightRecordsController],
  providers: [WeightRecordsService],
})
export class WeightRecordsModule {}