import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenPayload } from 'src/models';
import { AuthService } from 'src/auth/services/auth.service';
import { FetchQueryDto } from 'src/dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: TokenPayload) {
    const query = new FetchQueryDto({ id: payload.id });
    const user = await this.authService.user(query);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
