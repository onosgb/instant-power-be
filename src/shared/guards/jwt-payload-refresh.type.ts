import { TokenPayload } from 'src/models/token.model';

export type JwtPayloadWithRt = TokenPayload & { refreshToken: string };
