import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PetMedication } from './entities/medication.entity';
import { PetMedicationsController } from './medications.controller';
import { PetMedicationsService } from './medications.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PetMedication])],
  controllers: [PetMedicationsController],
  providers: [PetMedicationsService],
})
export class PetMedicationsModule {}
