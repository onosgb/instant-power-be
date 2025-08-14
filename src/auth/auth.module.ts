import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AuthService, VerificationService],
  controllers: [AuthController],
  exports: [AuthService, VerificationService],
})
export class AuthModule {}
