import { ThrowBadRequest } from './../../utils/errror_message';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { VerificationService } from './verification.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/shared/services/prisma.service';
import { AuthenticationError, ERROR_MESSAGES } from 'src/utils/errror_message';
import { TokenModel, TokenPayload } from 'src/models';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { OAuth2Client } from 'google-auth-library';
import {
  ChangePasswordDto,
  FetchAllQueryDto,
  FetchOptionDto,
  FetchQueryDto,
} from 'src/dto';
import { MailService } from 'src/shared/services/mailer.service';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from 'src/auth/dto/reset_password.dto';
import { Prisma, StatusEnum, Token, User } from 'prisma';

@Injectable()
export class AuthService {
  [x: string]: any;
  readonly oauth2Client!: OAuth2Client;
  readonly msTenantId = process.env.MS_TENANT_ID!;
  readonly msClientId = process.env.MS_CLIENT_ID!;
  readonly msclientSecret = process.env.MS_CLIENT_SECRET!;
  readonly msRedirectUri = process.env.MS_REDIRECT_URI!;

  readonly msScopes = process.env.MS_SCOPES!;
  constructor(
    private prisma: PrismaService,
    private readonly verificationService: VerificationService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private http: HttpService,
    private mailService: MailService,
  ) {
    this.oauth2Client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  async getAll(query: FetchAllQueryDto) {
    try {
      const userQueryDto = new FetchAllQueryDto(query);

      // Build the Prisma query using the DTO
      const prismaQuery = userQueryDto.buildPrismaQuery();

      const users = await this.prisma.user.findMany(prismaQuery);

      // Optionally, return pagination metadata
      const totalCount = await this.prisma.user.count({
        where: prismaQuery.where,
      });
      const totalPages = Math.ceil(totalCount / userQueryDto.pageSize);

      return {
        data: users.map((da) => {
          const { password: ls, ...others } = da;
          return others;
        }),
        pagination: {
          page: userQueryDto.page,
          pageSize: userQueryDto.pageSize,
          totalCount,
          totalPages,
        },
      };
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async getOne(query: FetchQueryDto) {
    try {
      // Build the Prisma query
      const user = new FetchQueryDto(query);
      const prismaQuery = user.buildPrismaQuery();

      // Fetch the user
      const log = await this.prisma.user.findUnique(prismaQuery);

      if (!log) {
        throw new Error('Transaction not found');
      }
      const { password: ls, ...others } = log;

      return others;
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async user(query: FetchOptionDto) {
    try {
      // Build the Prisma query
      const user = new FetchOptionDto(query);
      const prismaQuery = user.buildPrismaQuery();

      // Fetch the user
      const log = await this.prisma.user.findFirst(prismaQuery);

      if (!log) {
        throw new HttpException('No user found!', 404);
      }

      if (log.imageUrl) {
        const imageUrl = await this.s3Service.signedUrl(log.imageUrl);
        log.imageUrl = imageUrl;
      }
      const { password: ls, ...others } = log;
      return others;
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred',
        error.status || 500,
      );
    }
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    data.email = data.email.trim().toLowerCase();
    const getUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (getUser) {
      throw new HttpException('Email already exists!', 400);
    }

    if (!data.password) {
      throw new HttpException('Password is required!', 400);
    }

    // Hash password before saving to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    // Create user with hashed password
    const createdUser = await this.prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
    this.verificationService.generateEmailVerification(createdUser.email);

    return createdUser;
  }

  async signIn({ email, password }: { email: string; password: string }) {
    try {
      // Validate input
      if (!email || !password) {
        throw new HttpException('Username and password are required!', 400);
      }

      // Find user by email
      const user = await this.prisma.user.findFirst({
        where: {
          email: email,
        },
        include: {
          token: true,
        },
      });

      if (!user) {
        throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
      }

      // Check if password is valid
      if (!password || !user.password) {
        throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
      }

      // Check if user is active
      if (user.status !== 'Active') {
        await this.verificationService.generateEmailVerification(user.email);
        throw new AuthenticationError(
          ERROR_MESSAGES.ACCOUNT_NOT_ACTIVE,
          HttpStatus.FAILED_DEPENDENCY,
        );
      }

      if (user.imageUrl) {
        user.imageUrl = await this.s3Service.signedUrl(user.imageUrl);
      }

      // Generate and update tokens
      const token = await this.generateAndUpdateTokens(user);
      const { password: r, ...others } = user;
      // Return user with tokens
      return {
        user: others,
        token: token,
      };
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async signupUser(
    data: Prisma.UserCreateInput,
  ): Promise<{ message: string; data: string }> {
    data.email = data.email.toLowerCase();
    const user = await this.createUser(data);
    return {
      message:
        'Your account has been created successfuly. Please check your mail for verification!',
      data: user.email,
    };
  }

  // async forgotPassword(email: string) {
  //   try {
  //     // Find user by email
  //     const user = await this.prisma.user.findFirst({
  //       where: {
  //         email: email.toLowerCase(),
  //       },
  //     });

  //     if (!user) {
  //       throw new HttpException('User not found!', 404);
  //     }

  //     // Generate and send reset token
  //     const result = await this.verificationService.generateCode(
  //       user.email,
  //       30,
  //       true,
  //     );
  //     await this.mailService.sendResetPasswordMail(
  //       user,
  //       result.verification.code,
  //     );

  //     return {
  //       message: 'Reset token sent successfully!',
  //     };
  //   } catch (error) {
  //     throw new HttpException(error.message, error.status);
  //   }
  // }

  async resetPassword({ code, email, password }: ResetPasswordDto) {
    try {
      // Find user by email
      const user = await this.prisma.user.findFirst({
        where: {
          email: email,
        },
        include: {
          token: true,
        },
      });

      if (!user) {
        throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
      }

      const verification = await this.verificationService.getVerification(
        String(code),
        user.id,
      );

      if (!verification) {
        throw new AuthenticationError(
          ERROR_MESSAGES.INVALID_VERIFICATION_CODE,
          401,
        );
      }

      // Hash password before saving to the database
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update user with hashed password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Return user with tokens
      return {
        message: 'Password reset successfully!',
      };
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  private async generateAndUpdateTokens(user: User) {
    try {
      const token = await this.createToken(user);
      const newToken = {
        refreshToken: token.refresh_token,
        accessToken: token.access_token,
      };
      const create: Prisma.TokenCreateInput = newToken;
      await this.prisma.token.upsert({
        where: { id: user.id },
        create: { ...newToken, user: { connect: { id: user.id } } },
        update: newToken,
      });

      return newToken;
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async updateUser(user: User, data: Prisma.UserUpdateInput) {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data,
    });
    if (updatedUser.imageUrl) {
      user.imageUrl = await this.s3Service.signedUrl(updatedUser.imageUrl);
    }
    const { password: ls, ...us } = updatedUser;
    return us;
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async createToken({ id, name, email }: User): Promise<TokenModel> {
    const jwtPayload: TokenPayload = {
      id,
      name,
      email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION_TIME'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('RT_SECRET'),
        expiresIn: this.configService.get('RT_EXPIRATION_TIME'),
      }),
    ]);
    return { access_token: at, refresh_token: rt };
  }

  async verifyAccount(code: number, email: string) {
    const getUser = await this.prisma.user.findUnique({ where: { email } });

    if (!getUser) throw new BadRequestException('User not found!');

    const confirm = await this.verificationService.getVerification(
      String(code),
      getUser.id,
    );
    if (confirm) {
      if (getUser.status === 'Active') {
        return { error: 'You have already verified you account!' };
      }
      await this.prisma.user.update({
        where: { id: getUser.id },
        data: { status: 'Active' },
      });

      const token = await this.generateAndUpdateTokens(getUser);
      const { password: r, ...others } = getUser;
      // Return user with tokens

      return {
        message: 'Your account has been verified!',
        data: { user: others, token: token },
      };
    } else {
      return { error: 'Something went wrong!' };
    }
  }

  async refreshToken(user: User): Promise<TokenModel> {
    return await this.createToken({ ...user, id: user['id'] });
  }

  async getToken(token: string): Promise<Token> {
    try {
      const newToken = await this.prisma.token.findFirst({
        where: { refreshToken: token },
      });

      if (!newToken) throw new UnauthorizedException('token not found!');
      return newToken;
    } catch (error) {
      throw new UnauthorizedException('token not found!');
    }
  }

  async getGoogleTokens(code: string, redirect: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken({
        code,
        redirect_uri: `${redirect}`,
      });

      return tokens as {
        access_token: string;
        refresh_token: string;
        expiry_date: number;
      };
    } catch (error) {
      console.error(error);
    }
  }

  async getGoogleInfo(token: string) {
    const oauth2Client = this.oauth2Client;
    oauth2Client.setCredentials({ access_token: token });

    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const res = await oauth2Client.request({ url: userInfoUrl });
    const data = res.data as any;
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }

  async refreshGoogleToken(refreshToken: string) {
    const oauth2Client = this.oauth2Client;
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  }

  async verifyGoogleToken(accessToken: string) {
    try {
      const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);
      return !!tokenInfo;
    } catch (error) {
      return false;
    }
  }

  async getLawcusTokens(code: string) {
    const payload = {
      grant_type: 'authorization_code',
      code: code,
      client_id: this.configService.get('LAWCUS_CLIENT_ID'),
      client_secret: this.configService.get('LAWCUS_CLIENT_SECRET'),
      redirect_uri: this.configService.get('LAWCUS_REDIRECT'),
    };
    try {
      const { data } = await lastValueFrom(
        this.http.post('https://auth.lawcus.com/oauth/token', payload, {}),
      );

      return {
        access_token: data.access_token as string,
        refresh_token: data.refresh_token as string,
        expires_in: this.timeToMilSec(data.expires_in),
      };
    } catch (error) {
      throw new HttpException(
        `${error.message}: code=${JSON.stringify(payload)}`,
        error.response?.status || 500,
      );
    }
  }

  async getLawcusRefreshToken(refresh_token: string) {
    const payload = {
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: this.configService.get('LAWCUS_CLIENT_ID'),
      client_secret: this.configService.get('LAWCUS_CLIENT_SECRET'),
      redirect_uri: this.configService.get('LAWCUS_REDIRECT'),
    };
    try {
      const { data } = await lastValueFrom(
        this.http.post('https://auth.lawcus.com/oauth/token', payload),
      );

      return {
        access_token: data.access_token as string,
        refresh_token: data.refresh_token as string,
        expires_in: this.timeToMilSec(data.expires_in),
      };
    } catch (error) {
      throw new HttpException(
        `${error.message}: code=${JSON.stringify(payload)}`,
        error.response?.status || 500,
      );
    }
  }

  timeToMilSec(expires: string): number {
    const expiresIn = parseInt(expires, 10); // Convert to number
    const expirationTime = Date.now() + expiresIn * 1000;
    return expirationTime;
  }

  isTokenExpired(expirationTime: number): boolean {
    return Date.now() >= expirationTime;
  }

  async changePassword(data: ChangePasswordDto, _user: User) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: _user.id },
        select: { password: true, id: true, name: true, email: true },
      });

      if (!user) {
        throw new HttpException('Something went wrong', 500);
      }

      const validPassword = await bcrypt.compare(
        data.oldPassword,
        user.password!,
      );

      if (!validPassword)
        throw new HttpException('Old password is invalid', 400);
      // Hash password before saving to the database
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      const msg = `
          <h3>Dear ${user.name},</h3>
          <p>Your password has been changed successfuly!</p>
          <p>If you performed this request, please ignore this email message .</p>
          <p>For any further assistance or if you have any questions, please don't hesitate to reach out to our support team at Optimal Connect Support.</p>
          <p>Thank you for using Optimal Connect.</p>
          <p>Best regards,</p>
          <p>Optimal Support</p>`;
      this.mailService.sendEmail(user.email, 'CHANGED PASSWORD', msg);
      return {
        msg: 'Your password has been changed successfully!',
        data: null,
      };
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async avatarUpload(file, user: User, key?: string) {
    try {
      const url = await this.s3Service.uploadFile(file);
      if (url) {
        await this.updateUser(user, { imageUrl: url.url });
        if (key) {
          this.s3Service.deleteFile(key);
        }
        const res = await this.s3Service.signedUrl(url.url);
        return { msg: 'Avatar updated successfully!', url: res };
      }
      throw new BadRequestException('Fail to upload image');
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async googleAuth(code: string, redirect: string) {
    try {
      const tokens = await this.getGoogleTokens(code, redirect);

      const userInfo = await this.getGoogleInfo(tokens!.access_token);

      const data = {
        email: userInfo.email,
        oauth: true,
        oauthProvider: 'GOOGLE',
        name: userInfo.name,
        imageUrl: userInfo.picture,
        status: StatusEnum.Active,
      };
      let user = await this.prisma.user.findUnique({
        where: { email: userInfo.email },
        include: {
          token: true,
        },
      });

      if (!user) {
        const create: Prisma.UserCreateInput = data;
        user = await this.prisma.user.create({
          data: create,
          include: { token: true },
        });
      } else {
        user = await this.prisma.user.update({
          where: { email: user.email },
          data: { oauth: true, oauthProvider: 'GOOGLE', name: userInfo.name },
          include: { token: true },
        });
      }

      const token = await this.generateAndUpdateTokens(user);

      if (user.imageUrl) {
        user.imageUrl = await this.s3Service.signedUrl(user.imageUrl);
      }

      return { user, token };
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async microsoft(tokend: string) {
    try {
      const userInfo = await this.getMSInfo(tokend);
      const data = {
        email: userInfo.mail,
        oauth: true,
        oauthProvider: 'MICROSOFT',
        name: userInfo.displayName,
        status: StatusEnum.Active,
      };
      let user = await this.prisma.user.findUnique({
        where: { email: userInfo.mail },
        include: {
          token: true,
        },
      });

      if (!user) {
        const create: Prisma.UserCreateInput = data;
        user = await this.prisma.user.create({
          data: create,
          include: { token: true },
        });
      }

      const token = await this.generateAndUpdateTokens(user);

      if (user.imageUrl) {
        user.imageUrl = await this.s3Service.signedUrl(user.imageUrl);
      }

      return { user, token };
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async refreshMicrosoftToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresAt: number; refreshToken: string }> {
    const params = new URLSearchParams();
    params.append('client_id', this.msClientId);
    params.append('client_secret', this.msclientSecret);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token'); // Fixed this line
    params.append('scope', this.msScopes); // Use original scopes

    const response = await fetch(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new UnauthorizedException(
        `Failed to refresh token: ${data.error_description || response.statusText}`,
      );
    }

    const expiresInSeconds = data.expires_in;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken, // Fallback to old refresh token if new one isn't provided
      expiresAt: expiresInSeconds,
    };
  }

  async logout(user: User) {
    try {
      const token = await this.prisma.token.findFirst({
        where: { id: user.id },
      });
      if (!token) throw new BadRequestException('Failed to logout!');

      await this.prisma.token.update({
        where: { id: token.id },
        data: {
          refreshToken: `214${token.refreshToken}afds334`,
          accessToken: token.accessToken,
        },
      });
    } catch (error) {
      ThrowBadRequest(error);
    }
  }
}
