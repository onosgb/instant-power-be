import { BadRequestException, HttpException, Injectable } from '@nestjs/common';

import { randomBytes } from 'crypto';
import { Prisma, Verification } from 'prisma';
import { MailService } from 'src/shared/services/mailer.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { ThrowBadRequest } from 'src/utils/errror_message';

const generateRandomString = (length: number, chars: string): string => {
  const bytes = randomBytes(length);
  const result: string[] = [];
  const charsLength = chars.length;

  for (let i = 0; i < length; i++) {
    result.push(chars[bytes[i] % charsLength]);
  }

  return result.join('');
};

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async verification(
    data: Prisma.VerificationCreateInput,
  ): Promise<Verification> {
    try {
      const confirmed = await this.prisma.verification.create({
        data,
      });

      if (!confirmed) throw new HttpException('Invalid token!', 400);

      const expires = new Date();
      // check for verification expiration;
      if (expires > confirmed.expires) {
        throw new HttpException('Your token has expired, please resend!', 400);
      }

      return confirmed;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async generateCode(email: string, expires = 15, alphanumeric = false) {
    try {
      const code = alphanumeric
        ? generateRandomString(10, '1234567890abcdef')
        : this.otp();
      const date = new Date();
      date.setMinutes(date.getMinutes() + expires);
      const user = await this.prisma.user.findUnique({
        where: { email: email },
      });

      if (!user) {
        throw new BadRequestException('User not found!');
      }

      const result = await this.prisma.verification.upsert({
        where: {
          userId: user.id, // Use `userId` as the unique identifier
        },
        update: {
          code: String(code), // Update the code
          expires: date, // Update the expiration date
        },
        create: {
          userId: user.id, // Create a new record if it doesn't exist
          code: String(code),
          expires: date,
        },
      });

      return {
        user,
        verification: result,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async generateEmailVerification(email: string) {
    try {
      const { verification, user } = await this.generateCode(email);
      const { code } = verification;
      if (verification) {
        this.mailService.verificationMessage(user, code);
        return {
          message: 'Request has been sent to your mail, please check your mail',
        };
      }

      throw new HttpException('Sorry error occurred!', 400);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getVerification(code: string, userId: number): Promise<Verification> {
    try {
      const verification = await this.prisma.verification.findUnique({
        where: { userId: userId, code },
      });

      if (!verification) {
        throw new HttpException('Invalid Verification code!', 400);
      }

      return verification;
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async generateOtp(userId: string) {
    try {
      const { user, verification } = await this.generateCode(userId);

      // send the otp to the user
      await this.mailService.sendEmail(
        user.email,
        `Optimal Connect OTP`,
        `This is your one time OTP: ${verification.code}`,
      );
      return { expires: verification.expires };
    } catch (error) {
      throw new HttpException(error.message, error.status ?? 500);
    }
  }

  otp() {
    const min = 10000,
      max = 99999; // Ensure max is 9999
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
