import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './guards/jwt.strategy';
import { RefreshTokenStrategy } from './guards/refresh-token.strategy';
import { PrismaService } from './services/prisma.service';
import { AuthService } from '../auth/services/auth.service';

import { MailService } from './services/mailer.service';
import { VerificationService } from '../auth/services/verification.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}`,
        },
      }),
    }),
  ],

  providers: [
    JwtService,
    JwtStrategy,
    RefreshTokenStrategy,
    ConfigService,
    PrismaService,
    AuthService,
    VerificationService,
    MailService,
  ],
  exports: [
    HttpModule,
    JwtService,
    JwtStrategy,
    RefreshTokenStrategy,
    PrismaService,
    ConfigService,
    MailService,
  ],
})
export class SharedModule {}
