import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { RefreshTokenAuthGuard } from '../../shared/guards/refresh-token.guard';
import { JwtAuthGuard } from '../../shared/guards/jwt-authentication.guard';
import { VerificationService } from '../services/verification.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CallbackQueryDto } from '../dto/create-send.dto';
import {
  AvatarUploadDto,
  ChangePasswordDto,
  FetchAllQueryDto,
  FetchOptionDto,
  FetchQueryDto,
} from 'src/dto';
import { User, Prisma } from 'prisma';
import { GetUser } from 'src/shared/decorators/get-user.decorator';
import { AccountVerificationDto } from '../dto/account_verification.dto';
import { ForgotPasswordDto } from '../dto/forgot_password.dto';
import { ResetPasswordDto } from '../dto/reset_password.dto';
import { SignInDto } from '../dto/signin.dto';
import { SignUpDto } from '../dto/signup.dto';
import { ProfileUpdateDto } from '../dto/profile_update.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Document the header in Swagger
  @ApiResponse({ status: 200, description: 'Users successfully feched' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async users(@Query() query: FetchAllQueryDto) {
    return await this.authService.getAll(query);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@GetUser() user: User) {
    return this.authService.logout(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Document the header in Swagger
  @ApiResponse({ status: 200, description: 'Profile feched' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async profile(
    @Query() query: FetchOptionDto, // Validate the query parameters
    @GetUser() user: User,
  ) {
    query.id = user.id;
    return this.authService.user(query);
  }

  @Get('option')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Document the header in Swagger
  @ApiResponse({ status: 200, description: 'User successfully feched' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async option(
    @Query() query: FetchOptionDto, // Validate the query parameters
  ) {
    return this.authService.user(query);
  }

  @Get('create-send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Document the header in Swagger
  @ApiResponse({ status: 201, description: 'Intuit authorization created' })
  async createSend(@GetUser() user: User) {
    return this.authService.createCampaignMonitorAuthorization(user.email);
  }

  @Get('create-send/callback')
  @ApiResponse({ status: 200, description: 'Intuit authorization completed' })
  async createSendCallback(@Query() query: CallbackQueryDto) {
    console.log(query);
    return await this.authService.completeCampaignMonitorAuthorization(
      query.code!,
      query.email!,
    );
  }

  @Get('intuit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Document the header in Swagger
  @ApiResponse({ status: 201, description: 'Intuit authorization created' })
  async intuit(@GetUser() user: User) {
    return await this.authService.createIntuitAuthorization(user.email);
  }

  @Get('intuit/callback')
  @ApiResponse({ status: 200, description: 'Intuit authorization completed' })
  async intuitCallback(@Query() query: CallbackQueryDto) {
    return await this.authService.completeIntuitAuthorization({
      code: query.code!,
      email: query.email!,
      realmId: query.realmId!,
    });
  }

  @UseGuards(RefreshTokenAuthGuard)
  @ApiOperation({ summary: 'Refresh Access Token' }) // Describe the endpoint
  @ApiBearerAuth() // Document the header in Swagger
  @Get('refresh-token')
  async refreshToken(@GetUser() user: User) {
    return this.authService.refreshToken(user);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('redirect') url: string,
  ) {
    const data = await this.authService.googleAuth(code, url);
    return data;
  }

  @Get('microsoft/callback')
  async microsoft(@Query('token') token: string) {
    const data = await this.authService.microsoft(token);
    return data;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Document the header in Swagger
  @ApiResponse({ status: 200, description: 'User successfully feched' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UsePipes(new ValidationPipe({ transform: true })) // Enable validation
  async getOne(
    @Param('id') id: number, // Parse and validate the ID
    @Query() query: FetchQueryDto, // Validate the query parameters
  ) {
    // Set the ID in the query object
    query.id = id;
    return this.authService.getOne(query);
  }

  @Post()
  @ApiOperation({ summary: 'User sign-up' }) // Add a description for the endpoint
  @ApiBody({ type: SignUpDto }) // Specify the request body schema
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UsePipes(new ValidationPipe({ transform: true })) // Enable validation
  async create(
    @Body() user: SignUpDto,
  ): Promise<{ message: string; data: string }> {
    return await this.authService.signupUser(user);
  }

  @Post('signin')
  @ApiOperation({ summary: 'User sign-in' }) // Add a description for the endpoint
  @ApiBody({ type: SignInDto }) // Specify the request body schema
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UsePipes(new ValidationPipe({ transform: true })) // Enable validation
  signIn(@Body() user: { email: string; password: string }) {
    return this.authService.signIn(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot Password' }) // Add a description for the endpoint
  @ApiBody({ type: ForgotPasswordDto }) // Specify the request body schema
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async forgotPassword(@Body() user: { email: string }) {
    return this.authService.forgotPassword(user.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset Password' }) // Add a description for the endpoint
  @ApiBody({ type: ResetPasswordDto }) // Specify the request body schema
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async resetPassword(
    @Body() input: { code: string; email: string; password: string },
  ) {
    return this.authService.resetPassword(input);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Account Verification' }) // Add a description for the endpoint
  @ApiBody({ type: AccountVerificationDto }) // Specify the request body schema
  @ApiResponse({ status: 200, description: 'Account Verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Account verification failed or expired otp',
  })
  async verifyAccount(
    @Body('code') code: string,
    @Body('email') email: string,
  ) {
    const message = await this.authService.verifyAccount(+code, email);
    return message;
  }

  @Post('generate-otp')
  @ApiQuery({ name: 'email', description: 'User Email', required: true })
  async generateOtp(@Query('email') email: string) {
    return await this.verificationService.generateOtp(email);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Your password has been changed successfully!',
  })
  async changePassword(
    @Body() passwordData: ChangePasswordDto,
    @GetUser() user: User,
  ) {
    return await this.authService.changePassword(passwordData, user);
  }

  @Put('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Profile Update' }) // Add a description for the endpoint
  @ApiBody({ type: ProfileUpdateDto }) // Specify the request body schema
  @ApiResponse({ status: 200, description: 'Account Verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Profile update failed',
  })
  async updateProfile(@Body() data: ProfileUpdateDto, @GetUser() user: User) {
    const userData: Prisma.UserUpdateInput = data;

    return await this.authService.updateUser(user, userData);
  }

  @Post('upload-avatar')
  @ApiBody({ type: AvatarUploadDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException(
              'Only JPG, JPEG, and PNG files are allowed!',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async avatar(
    @UploadedFile() file,
    @GetUser() user: User,
    @Body('filekey') key?: string,
  ) {
    return this.authService.avatarUpload(file, user, key);
  }
}
