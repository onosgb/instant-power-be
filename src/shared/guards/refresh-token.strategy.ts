import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadWithRt } from './jwt-payload-refresh.type';
import { TokenPayload } from 'src/models';
import { AuthService } from 'src/auth/services/auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('RT_SECRET')!,
      passReqToCallback: true, // ✅ Must be true to access `req`
    });
  }

  async validate(
    req: Request,
    payload: TokenPayload,
  ): Promise<JwtPayloadWithRt> {
    const refreshToken = req
      ?.get('Authorization')
      ?.replace('Bearer', '')
      .trim();

    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');

    const token = await this.authService.getToken(refreshToken);
    if (!token) {
      throw new UnauthorizedException('Token not found!');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
